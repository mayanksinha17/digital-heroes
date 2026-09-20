-- seed.sql
-- Digital Heroes: Initial Platform Data, Plans, Settings, and Verified Charities

-- 1. Default Platform Settings (D-settings registry)
insert into platform_settings (key, value, description) values
  ('currency', '"inr"', 'Default platform currency ISO code'),
  ('prize_pool_percent', '50', 'Percentage of subscription fee allocated to monthly prize pool'),
  ('tier_shares', '{"5": 40, "4": 35, "3": 25}', 'Prize pool distribution percentages across match tiers'),
  ('score_retained_count', '5', 'Number of latest scores retained in rolling window'),
  ('min_scores_to_enter', '5', 'Minimum scores required to be eligible for a monthly draw'),
  ('backdated_score_policy', '"reject"', 'Policy for scores older than all 5 retained (reject or accept_and_trim)'),
  ('algorithm_bias', '"frequent"', 'Algorithmic draw bias: frequent (common scores) or rare'),
  ('algorithm_weight_smoothing', '1', 'Smoothing added to score frequencies to prevent zero probability'),
  ('unclaimed_lower_tier_policy', '"retain"', 'Policy for unwon 4/3 tiers (retain or roll_to_jackpot)'),
  ('charity_min_percent', '10', 'Minimum charity percentage enforced at signup and subscription'),
  ('charity_max_percent', '50', 'Maximum selectable charity percentage'),
  ('proof_max_attempts', '3', 'Maximum proof upload attempts for winner verification'),
  ('proof_max_size_mb', '5', 'Maximum proof file upload size in MB'),
  ('draw_timezone', '"Asia/Kolkata"', 'Timezone used for monthly draw boundaries and dates')
on conflict (key) do update set value = excluded.value;

-- 2. Subscription Plans (PRD §04, D-03)
insert into plans (code, name, billing_interval, price_cents, currency, is_active) values
  ('monthly', 'Monthly Hero Plan', 'month', 49900, 'INR', true),
  ('yearly', 'Yearly Hero Plan (Discounted)', 'year', 499900, 'INR', true)
on conflict (code) do nothing;

-- 3. Verified Charities (PRD §08)
insert into charities (
  id,
  slug,
  name,
  short_description,
  description,
  category,
  logo_url,
  hero_image_url,
  website_url,
  is_featured,
  featured_order,
  is_active
) values
  (
    'a0000000-0000-0000-0000-000000000001',
    'junior-golf-foundation',
    'Junior Golf Foundation',
    'Empowering underprivileged youth through golf mentorship and sports education.',
    'The Junior Golf Foundation provides equipment, coaching, and educational scholarships to talented youngsters from underserved communities, teaching life skills through the spirit of the game.',
    'Youth & Sports',
    '/charities/junior-golf-logo.png',
    '/charities/junior-golf-hero.jpg',
    'https://juniorgolf.org.example',
    true,
    1,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'green-fairways-conservation',
    'Green Fairways Conservation',
    'Protecting native flora, pollinators, and water resources across recreational lands.',
    'Green Fairways Conservation partners with open spaces and communities to restore biodiversity, plant native trees, and establish sustainable water management systems.',
    'Environment',
    '/charities/green-fairways-logo.png',
    '/charities/green-fairways-hero.jpg',
    'https://greenfairways.org.example',
    true,
    2,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'veterans-care-network',
    'Veterans Care Network',
    'Providing mental health support and adaptive sports rehabilitation for armed forces veterans.',
    'Veterans Care Network delivers comprehensive trauma support, physical therapy, and social integration programs for service members and their families.',
    'Health & Veterans',
    '/charities/veterans-care-logo.png',
    '/charities/veterans-care-hero.jpg',
    'https://veteranscare.org.example',
    false,
    null,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'clean-water-allies',
    'Clean Water Allies',
    'Installing solar-powered clean drinking water filtration units in rural communities.',
    'Clean Water Allies works in drought-affected villages to establish self-sustaining solar water purification facilities, ensuring reliable access to safe drinking water.',
    'Community Development',
    '/charities/clean-water-logo.png',
    '/charities/clean-water-hero.jpg',
    'https://cleanwaterallies.org.example',
    false,
    null,
    true
  )
on conflict (slug) do nothing;

-- 4. Sample Charity Events (PRD §08.2: "upcoming events such as golf days")
insert into charity_events (charity_id, title, description, starts_at, location, is_published) values
  (
    'a0000000-0000-0000-0000-000000000001',
    'Annual Youth Championship & Charity Pro-Am',
    'A day of golf, dinner, and mentorship auctions supporting our junior academy.',
    now() + interval '14 days',
    'Royal Springs Golf Course, Delhi',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Eco-Sanctuary Tree Planting Invitational',
    'Join our community drive to plant 2,000 indigenous trees across golf course green belts.',
    now() + interval '30 days',
    'Karnataka Golf Association, Bengaluru',
    true
  )
on conflict do nothing;
