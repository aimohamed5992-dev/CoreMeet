-- CoreMeet — database schema (MySQL 8 / MariaDB 10.4+)
-- Schema only: no user rows, tokens or PII. Prefer `dotnet ef database update`;
-- this dump is a convenience for importing the structure directly (e.g. phpMyAdmin).
--
-- Server version: 10.4.28-MariaDB

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `coremeet`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `meeting_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `sender_participant_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `sender_name` varchar(120) NOT NULL,
  `content` varchar(4000) NOT NULL,
  `sent_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meetings`
--

CREATE TABLE `meetings` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `code` varchar(32) NOT NULL,
  `title` varchar(200) NOT NULL,
  `host_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `status` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `ended_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meeting_participants`
--

CREATE TABLE `meeting_participants` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `meeting_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `user_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  `display_name` varchar(120) NOT NULL,
  `role` int(11) NOT NULL,
  `is_connected` tinyint(1) NOT NULL,
  `joined_at` datetime(6) NOT NULL,
  `left_at` datetime(6) DEFAULT NULL,
  `avatar_color` varchar(9) NOT NULL DEFAULT '',
  `avatar_url` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `user_id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `token_hash` varchar(128) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `replaced_by_token_hash` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(256) NOT NULL,
  `password_hash` varchar(256) NOT NULL,
  `avatar_color` varchar(9) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `avatar_url` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `__EFMigrationsHistory`
--

CREATE TABLE `__EFMigrationsHistory` (
  `migration_id` varchar(150) NOT NULL,
  `product_version` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Applied migrations
--

INSERT INTO `__EFMigrationsHistory` (`migration_id`, `product_version`) VALUES
('20260906161001_InitialCreate', '9.0.19'),
('20260906162038_AddRefreshTokens', '9.0.19'),
('20260906164303_UniqueParticipantPerMeeting', '9.0.19'),
('20260906173807_AvatarsAndGuests', '9.0.19');

--
-- Indexes for dumped tables
--

ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_chat_messages_meeting_id_sent_at` (`meeting_id`,`sent_at`);

ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_meetings_code` (`code`),
  ADD KEY `ix_meetings_host_id` (`host_id`);

ALTER TABLE `meeting_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_meeting_participants_meeting_id_user_id` (`meeting_id`,`user_id`),
  ADD KEY `ix_meeting_participants_user_id` (`user_id`);

ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_refresh_tokens_token_hash` (`token_hash`),
  ADD KEY `ix_refresh_tokens_user_id` (`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`);

ALTER TABLE `__EFMigrationsHistory`
  ADD PRIMARY KEY (`migration_id`);

--
-- Constraints for dumped tables
--

ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_meetings_meeting_id` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE;

ALTER TABLE `meetings`
  ADD CONSTRAINT `fk_meetings_users_host_id` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`);

ALTER TABLE `meeting_participants`
  ADD CONSTRAINT `fk_meeting_participants_meetings_meeting_id` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_meeting_participants_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
