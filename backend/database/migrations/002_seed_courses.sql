-- Migration 002: Seed golf courses
-- Uses UPSERT — safe to re-run, updates metadata if a course changes

INSERT INTO golf_courses (id, name, provider, booking_url, request_data, address)
VALUES
    (1,  'Cranston Country Club',    'foreup',   'https://foreupsoftware.com/index.php/booking/22225/10153#teetimes',      '{"id": 10153, "booking_class": 13646}',                                                          '69 Burlingame Rd, Cranston, RI 02921'),
    (2,  'Louisquisset Golf Club',   'teeitup',  'https://louisquisset-golf-club.book.teeitup.com/',                        '{"alias": "louisquisset-golf-club", "facilityIds": 11490}',                                      '1 Overlook Cir, North Providence, RI 02904'),
    (3,  'Connecticut National',     'teeitup',  'https://connecticut-national-golf-club.book.teeitup.com/',                '{"alias": "connecticut-national-golf-club", "facilityIds": 5166}',                              '136 Chase Rd, Putnam, CT 06260'),
    (4,  'Foster Country Club',      'foreup',   'https://foreupsoftware.com/index.php/booking/21021/6496#teetimes',        '{"id": 6496, "booking_class": 7851}',                                                            '67 Johnson Rd, Foster, RI 02825'),
    (5,  'Triggs',                   'foreup',   'https://foreupsoftware.com/index.php/booking/index/19339#/teetimes',      '{"id": 1457, "booking_class": 1029}',                                                            '1533 Chalkstone Ave, Providence, RI 02909'),
    (6,  'North Kingstown Golf Course', 'foreup', 'https://foreupsoftware.com/index.php/booking/22236/10204#/teetimes',     '{"id": 10204, "booking_class": 13839}',                                                          '615 Callahan Rd, North Kingstown, RI 02852'),
    (7,  'Crystal Lake',             'teesnap',  'https://crystallakegc.teesnap.net',                                       '{"baseUrl": "https://crystallakegc.teesnap.net", "course": 1323}',                              '100 Broncos Hwy, Mapleville, RI 02839'),
    (8,  'Stone E. Lee',             'teesnap',  'https://stoneeleagc.teesnap.net',                                         '{"baseUrl": "https://stoneeleagc.teesnap.net", "course": 1312}',                                '1411 County St, Attleboro, MA 02703'),
    (9,  'Country View',             'teesnap',  'https://countryviewgolf.teesnap.net',                                     '{"baseUrl": "https://countryviewgolf.teesnap.net", "course": 413}',                             '49 Club Ln, Harrisville, RI 02830'),
    (10, 'Laurel Lane',              'teesnap',  'https://laurellanecountryclub.teesnap.net',                               '{"baseUrl": "https://laurellanecountryclub.teesnap.net", "course": 446}',                       '309 Laurel Ln, West Kingston, RI 02892'),
    (11, 'Fenner Hill',              'teesnap',  'https://fennerhill.teesnap.net',                                          '{"baseUrl": "https://fennerhill.teesnap.net", "course": 1103}',                                  '33 Wheeler Ln, Hope Valley, RI 02832'),
    (12, 'Melody Hill',              'teesnap',  'https://melodyhillcc.teesnap.net',                                        '{"baseUrl": "https://melodyhillcc.teesnap.net", "course": 466}',                                '55 Melody Hill CC Rd #2238, Chepachet, RI 02814'),
    (13, 'Midville Country Club',    'teewire',  'https://teewire.net/midville',                                            '{"controller": "GzFront", "action": "getTimeSlot", "cid": "1", "cal_id": "1", "path": "/midville/teetimes/load.php"}', '100 Lombardi Ln, West Warwick, RI 02893'),
    (14, 'Met Links',                'foreup',   'https://foreupsoftware.com/index.php/booking/22800/11966#teetimes',       '{"id": 11966, "booking_class": 50955}',                                                          '500 Veterans Memorial Pkwy, East Providence, RI 02914')
ON CONFLICT (id) DO UPDATE
    SET name         = EXCLUDED.name,
        provider     = EXCLUDED.provider,
        booking_url  = EXCLUDED.booking_url,
        request_data = EXCLUDED.request_data,
        address      = EXCLUDED.address,
        updated_at   = NOW();

-- Reset sequence so future INSERTs without explicit IDs start after 14
SELECT setval('golf_courses_id_seq', (SELECT MAX(id) FROM golf_courses));
