-- 0011_publish_draw_atomic.sql
-- Digital Heroes: Transactional RPC for Atomic Draw Publishing

create or replace function public.publish_draw_atomic(
  p_draw_id uuid,
  p_admin_id uuid,
  p_simulation_id uuid,
  p_drawn_numbers smallint[],
  p_active_subscriber_count int,
  p_entry_count int,
  p_pool_new_cents bigint,
  p_pool_total_cents bigint,
  p_pool_5_cents bigint,
  p_pool_4_cents bigint,
  p_pool_3_cents bigint,
  p_rollover_out_cents bigint,
  p_unallocated_cents bigint,
  p_pool_breakdown jsonb,
  p_entries jsonb,
  p_winners jsonb
)
returns void
language plpgsql
security definer set search_path = public as $$
declare
  v_draw record;
  v_simulation record;
  v_entry jsonb;
  v_winner jsonb;
  v_entry_id uuid;
  v_total_prizes bigint := 0;
begin
  -- 1. Lock and verify draw state
  select * into v_draw from draws where id = p_draw_id for update;
  if not found then
    raise exception 'DRAW_NOT_FOUND: Draw not found' using errcode = 'P0002';
  end if;

  if v_draw.status = 'published' then
    raise exception 'DRAW_ALREADY_PUBLISHED: Draw is already published' using errcode = 'P0003';
  end if;

  -- 2. Verify simulation exists and belongs to this draw
  select * into v_simulation from draw_simulations where id = p_simulation_id and draw_id = p_draw_id;
  if not found then
    raise exception 'DRAW_NOT_SIMULATED: Simulation not found for this draw' using errcode = 'P0004';
  end if;

  -- 3. Calculate total prizes from winners
  for v_winner in select * from jsonb_array_elements(p_winners) loop
    v_total_prizes := v_total_prizes + (v_winner->>'prizeCents')::bigint;
  end loop;

  -- 4. Invariant assertion: poolNew + rolloverIn = totalPrizes + rolloverOut + unallocated
  if (p_pool_new_cents + v_draw.rollover_in_cents) <> (v_total_prizes + p_rollover_out_cents + p_unallocated_cents) then
    raise exception 'FINANCIAL_INVARIANT_VIOLATION: Funds in do not match funds out' using errcode = 'P0005';
  end if;

  -- 5. Insert draw entries (immutable participant snapshot)
  for v_entry in select * from jsonb_array_elements(p_entries) loop
    insert into draw_entries (
      draw_id,
      user_id,
      scores,
      match_count,
      tier
    ) values (
      p_draw_id,
      (v_entry->>'userId')::uuid,
      array(select jsonb_array_elements_text(v_entry->'scores')::smallint),
      (v_entry->>'matchCount')::smallint,
      (v_entry->>'tier')::smallint
    );
  end loop;

  -- 6. Insert draw winners
  for v_winner in select * from jsonb_array_elements(p_winners) loop
    select id into v_entry_id from draw_entries
    where draw_id = p_draw_id and user_id = (v_winner->>'userId')::uuid;

    insert into draw_winners (
      draw_id,
      entry_id,
      user_id,
      tier,
      prize_cents,
      verification_status,
      payment_status
    ) values (
      p_draw_id,
      v_entry_id,
      (v_winner->>'userId')::uuid,
      (v_winner->>'tier')::smallint,
      (v_winner->>'prizeCents')::bigint,
      'awaiting_proof',
      'pending'
    );
  end loop;

  -- 7. Update draw status to published
  update draws
  set status = 'published',
      drawn_numbers = p_drawn_numbers,
      active_subscriber_count = p_active_subscriber_count,
      entry_count = p_entry_count,
      pool_new_cents = p_pool_new_cents,
      pool_total_cents = p_pool_total_cents,
      pool_5_cents = p_pool_5_cents,
      pool_4_cents = p_pool_4_cents,
      pool_3_cents = p_pool_3_cents,
      rollover_out_cents = p_rollover_out_cents,
      unallocated_cents = p_unallocated_cents,
      pool_breakdown = p_pool_breakdown,
      published_simulation_id = p_simulation_id,
      published_at = now(),
      published_by = p_admin_id,
      updated_at = now()
  where id = p_draw_id;

  -- 8. Record audit log
  insert into audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    p_admin_id,
    'draw.publish',
    'draws',
    p_draw_id::text,
    jsonb_build_object('status', 'simulated', 'month', v_draw.draw_month),
    jsonb_build_object(
      'status', 'published',
      'drawn_numbers', p_drawn_numbers,
      'winners_count', jsonb_array_length(p_winners),
      'pool_total_cents', p_pool_total_cents,
      'rollover_out_cents', p_rollover_out_cents
    )
  );
end;
$$;
