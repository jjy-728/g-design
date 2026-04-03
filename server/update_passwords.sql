-- 更新用户密码为 admin123、teacher123、student123
USE g_design;

UPDATE users SET password = '$2a$10$VOkr.7Tpzh76iukDVquda.yJUJieBKYLoXieloDdY9CV.r3BKjbG.' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$qMROFA2066uOG2x9S6tpJOUSM0ddrPZXOmLGVPEOrvD0zu2r.6k/G' WHERE username = 'teacher';
UPDATE users SET password = '$2a$10$XYlh8QPLRiXGZHF7dMtqKuL6LnJFT.ki4F/DUVWVz7cVwLZvRD.G.' WHERE username = 'student';

-- 验证更新
SELECT username, password FROM users;
