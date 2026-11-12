-- Payment-received SMS: every new fee payment queues one SMS to the student's
-- parent in the school's language. Replays (same client_ref) queue nothing, and
-- a missing or malformed phone never blocks the payment itself.
create or replace function private.sc_record_fee_payment_impl(
  p_invoice uuid, p_amount numeric, p_method pay_method, p_reference text, p_client_ref uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_inv public.sc_fee_invoices%rowtype;
  v_payment uuid; v_no integer; v_receipt public.sc_fee_receipts%rowtype;
  v_remaining numeric;
  v_school text; v_lang text; v_student text; v_phone text; v_body text;
  v_amt text; v_rem text;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then raise exception 'invalid_amount'; end if;

  perform pg_advisory_xact_lock(hashtextextended('sc_receipt:' || v_tenant::text, 0));

  if p_client_ref is not null then
    select * into v_receipt from public.sc_fee_receipts where tenant_id = v_tenant and client_ref = p_client_ref;
    if found then
      select * into v_inv from public.sc_fee_invoices where tenant_id = v_tenant and id = v_receipt.invoice_id;
      return jsonb_build_object('receipt_id', v_receipt.id, 'receipt_no', v_receipt.receipt_no, 'amount', v_receipt.amount, 'remaining', v_inv.amount - v_inv.paid, 'replayed', true);
    end if;
  end if;

  select * into v_inv from public.sc_fee_invoices where tenant_id = v_tenant and id = p_invoice for update;
  if not found then raise exception 'invoice_not_found'; end if;
  if p_amount > v_inv.amount - v_inv.paid then raise exception 'overpayment'; end if;

  insert into public.payments (tenant_id, amount, method, reference, ref_table, ref_id)
  values (v_tenant, p_amount, p_method, p_reference, 'sc_fee_invoices', v_inv.id)
  returning id into v_payment;

  update public.sc_fee_invoices set paid = paid + p_amount where tenant_id = v_tenant and id = v_inv.id;

  select coalesce(max(receipt_no), 0) + 1 into v_no from public.sc_fee_receipts where tenant_id = v_tenant;
  insert into public.sc_fee_receipts (tenant_id, invoice_id, payment_id, receipt_no, amount, method, client_ref)
  values (v_tenant, v_inv.id, v_payment, v_no, p_amount, p_method, p_client_ref)
  returning * into v_receipt;

  v_remaining := v_inv.amount - v_inv.paid - p_amount;

  -- Payment-received SMS to the parent.
  select t.name, coalesce(t.default_lang, 'am'), s.full_name, g.phone
    into v_school, v_lang, v_student, v_phone
  from public.sc_enrollments e
  join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id
  left join public.sc_guardians g on g.tenant_id = s.tenant_id and g.id = s.guardian_id
  join public.tenants t on t.id = e.tenant_id
  where e.tenant_id = v_tenant and e.id = v_inv.enrollment_id;

  v_phone := regexp_replace(coalesce(v_phone, ''), '[\s-]', '', 'g');
  if v_phone ~ '^\+?[0-9]{9,15}$' then
    v_amt := to_char(p_amount, 'FM999,999,990.00');
    v_rem := to_char(v_remaining, 'FM999,999,990.00');
    v_body := case v_lang
      when 'om' then v_school || ': ' || v_student || 'f qarshii ' || v_amt || ' kaffalameera (' || v_inv.description || '). Lakk. nagahee ' || v_no || '. '
        || case when v_remaining > 0 then 'Kan hafe: ' || v_rem || ' qarshii.' else 'Guutummaatti kaffalameera.' end
      when 'en' then v_school || ': ' || v_amt || ' birr received for ' || v_student || ' (' || v_inv.description || '). Receipt no. ' || v_no || '. '
        || case when v_remaining > 0 then 'Still owed: ' || v_rem || ' birr.' else 'Fully paid.' end
      else v_school || '፡ ለ' || v_student || ' ' || v_amt || ' ብር ተከፍሏል (' || v_inv.description || ')። ደረሰኝ ቁ. ' || v_no || '። '
        || case when v_remaining > 0 then 'ቀሪ፡ ' || v_rem || ' ብር።' else 'ሙሉ በሙሉ ተከፍሏል።' end
    end;
    begin
      perform private.bot_queue_notification(v_tenant, 'sms', v_phone, v_body);
    exception when others then
      null; -- a queue problem must never undo a recorded payment
    end;
  end if;

  return jsonb_build_object('receipt_id', v_receipt.id, 'receipt_no', v_no, 'amount', p_amount, 'remaining', v_remaining, 'replayed', false);
end
$$;
