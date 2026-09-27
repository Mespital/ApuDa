create unique index if not exists profiles_one_self_human_per_owner_idx
on public.profiles(owner_user_id)
where relationship_to_user = 'self' and profile_type = 'human';
