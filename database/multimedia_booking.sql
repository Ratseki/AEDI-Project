-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 03, 2025 at 02:11 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `multimedia_booking`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('pending','confirmed','cancelled','partial','paid') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_area` varchar(10) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `package_name` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `num_people` int(11) DEFAULT 1,
  `time` varchar(10) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `service_id`, `date`, `status`, `created_at`, `first_name`, `last_name`, `email`, `phone_area`, `phone_number`, `package_name`, `note`, `num_people`, `time`, `location`) VALUES
(11, 4, 2, '2025-10-15', 'pending', '2025-10-21 10:59:49', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 4, '15:00', NULL),
(12, 4, 2, '2025-10-15', 'pending', '2025-10-21 11:00:12', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 4, '15:00', NULL),
(13, 4, 1, '2025-10-23', 'pending', '2025-10-21 11:07:59', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '17:00', NULL),
(14, 4, 1, '2025-10-23', 'pending', '2025-10-21 11:08:25', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '17:00', NULL),
(15, 3, 2, '2025-10-16', 'pending', '2025-10-22 07:17:06', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 2, '09:00', NULL),
(16, 3, 2, '2025-10-15', 'pending', '2025-10-22 08:05:56', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 4, '09:00', NULL),
(17, 3, 1, '2025-10-16', 'pending', '2025-10-22 09:00:42', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 5, '12:00', NULL),
(18, 3, 1, '2025-10-16', 'pending', '2025-10-22 09:01:26', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 5, '12:00', NULL),
(22, 3, 2, '2025-10-16', 'pending', '2025-10-22 09:56:47', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 3, '15:00', NULL),
(23, 3, 2, '2025-10-24', 'pending', '2025-10-22 10:52:36', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 3, '10:00', NULL),
(24, 3, 1, '2025-10-15', 'pending', '2025-10-22 14:18:25', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '15:00', NULL),
(25, 3, 1, '2025-10-24', 'pending', '2025-10-22 14:54:36', 'KC', 'AB', 'test123@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '16:00', NULL),
(26, 3, 1, '2025-10-14', 'pending', '2025-10-22 14:55:19', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 3, '16:00', NULL),
(27, 3, 3, '2025-10-17', 'pending', '2025-10-22 15:30:23', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Standard — $10', 'yes', 3, '13:00', NULL),
(28, 3, 1, '2025-10-14', 'pending', '2025-10-22 16:01:42', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 2, '13:00', NULL),
(29, 3, 1, '2025-10-10', 'pending', '2025-10-22 16:02:54', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 3, '14:00', NULL),
(30, 1, 1, '2025-10-23', 'confirmed', '2025-10-23 16:06:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(31, 4, 2, '2025-10-23', 'confirmed', '2025-10-23 16:08:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(32, 4, 1, '2025-10-23', 'confirmed', '2025-10-23 16:10:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(33, 4, 1, '2025-10-23', 'confirmed', '2025-10-23 16:10:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(34, 4, 1, '2025-10-15', 'pending', '2025-10-23 16:31:31', 'KC', 'Abella', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 1, '09:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gallery_access_codes`
--

CREATE TABLE `gallery_access_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('downpayment','full','paid') DEFAULT 'downpayment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_downpayment` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `photos`
--

CREATE TABLE `photos` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `watermarked_path` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_published` tinyint(1) DEFAULT 0,
  `price` decimal(10,2) DEFAULT 100.00,
  `status` enum('available','purchased','expired') DEFAULT 'available',
  `expires_at` datetime DEFAULT NULL,
  `purchased_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `photos`
--

INSERT INTO `photos` (`id`, `booking_id`, `user_id`, `uploaded_by`, `file_name`, `file_path`, `watermarked_path`, `uploaded_at`, `is_published`, `price`, `status`, `expires_at`, `purchased_at`, `created_at`) VALUES
(9, 11, 4, NULL, '', '/uploads/soteras.png', NULL, '2025-10-23 16:12:09', 0, 100.00, 'expired', '2025-10-31 01:00:21', '2025-10-24 01:00:21', '2025-10-24 00:12:09'),
(10, 11, 4, NULL, '', '/uploads/soteras.png', NULL, '2025-10-23 16:29:23', 0, 100.00, 'expired', '2025-10-31 00:52:33', '2025-10-24 00:52:33', '2025-10-24 00:29:23'),
(11, 11, 4, NULL, '', '/uploads/soteras.png', NULL, '2025-10-23 16:30:18', 0, 100.00, 'expired', '2025-10-31 00:50:54', '2025-10-24 00:50:54', '2025-10-24 00:30:18'),
(12, 11, 4, NULL, '', '/uploads/borleo.jpg', NULL, '2025-10-23 17:02:46', 0, 100.00, 'expired', '2025-10-31 01:03:28', '2025-10-24 01:03:28', '2025-10-24 01:02:46'),
(13, 11, 4, NULL, '', '/uploads/ambermcshine.jpg', NULL, '2025-10-23 17:03:11', 0, 100.00, 'expired', '2025-10-31 01:03:35', '2025-10-24 01:03:35', '2025-10-24 01:03:11'),
(14, 11, 4, NULL, '', '/uploads/soteras.png', NULL, '2025-10-23 17:50:59', 0, 100.00, 'available', NULL, NULL, '2025-10-24 01:50:59'),
(15, 11, 4, NULL, '', '/uploads/soteras.png', NULL, '2025-10-23 17:53:08', 1, 100.00, 'expired', '2025-10-31 02:09:15', '2025-10-24 02:09:15', '2025-10-24 01:53:08'),
(16, 11, 4, NULL, '', '/uploads/ambermcshine.jpg', NULL, '2025-10-23 17:53:59', 1, 100.00, 'expired', '2025-10-31 02:05:08', '2025-10-24 02:05:08', '2025-10-24 01:53:59'),
(17, 11, 4, NULL, '', '/uploads/ambermcshine.jpg', NULL, '2025-10-23 18:25:30', 1, 100.00, 'expired', '2025-10-31 02:25:34', '2025-10-24 02:25:34', '2025-10-24 02:25:30'),
(18, 11, 4, NULL, '', '/uploads/ambermcshine.jpg', NULL, '2025-10-23 18:27:04', 1, 100.00, 'expired', '2025-10-31 02:27:11', '2025-10-24 02:27:11', '2025-10-24 02:27:04'),
(19, 11, 4, NULL, '', '/uploads/ambermcshine.jpg', NULL, '2025-10-23 18:31:52', 1, 100.00, 'expired', '2025-10-31 02:31:57', '2025-10-24 02:31:57', '2025-10-24 02:31:52'),
(31, NULL, 1, 7, '', '/uploads/1762000415075.png', NULL, '2025-11-01 12:33:35', 1, 100.00, 'available', NULL, NULL, '2025-11-01 20:33:35'),
(33, NULL, 1, 7, '', '/uploads/1762000415096.png', NULL, '2025-11-01 12:33:35', 1, 100.00, 'available', NULL, NULL, '2025-11-01 20:33:35'),
(34, NULL, 5, 7, 'DP for Corrupt.png', '/uploads/1762078302539.png', NULL, '2025-11-02 10:11:42', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:11:42'),
(35, NULL, 5, 7, 'pat.png', '/uploads/1762078342970.png', NULL, '2025-11-02 10:12:22', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:12:22'),
(36, NULL, 5, 7, 'horse.jpg', '/uploads/1762078603646.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(37, NULL, 5, 7, '360_F_487659230_LIQIuM4OtZLTJ4juqUAfyZL24muRatdZ.jpg', '/uploads/1762078603651.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(38, NULL, 5, 7, '7-ortoneffectkcab.jpg', '/uploads/1762078603652.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(40, NULL, 5, 7, '475725406_2302902623416837_6374635398458049863_n.jpg', '/uploads/1762078603678.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(41, NULL, 5, 7, 'network-addressing-and-basic-troubleshooting(1).png', '/uploads/1762078654449.png', NULL, '2025-11-02 10:17:34', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:17:34'),
(42, NULL, 5, 7, 'network-addressing-and-basic-troubleshooting(1).png', '/uploads/1762078761894.png', NULL, '2025-11-02 10:19:21', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:19:21'),
(43, NULL, 5, 7, 'mesozoicomap2.png', '/uploads/1762078785061.png', NULL, '2025-11-02 10:19:45', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:19:45'),
(82, NULL, 3, 7, 'pat.png', '/uploads/1762086391300.png', NULL, '2025-11-02 12:26:31', 1, 100.00, 'available', NULL, NULL, '2025-11-02 20:26:31'),
(83, NULL, 3, 7, 'togif.gif', '/uploads/1762165272831.gif', NULL, '2025-11-03 10:21:12', 1, 100.00, 'available', NULL, NULL, '2025-11-03 18:21:12');

-- --------------------------------------------------------

--
-- Table structure for table `photo_purchases`
--

CREATE TABLE `photo_purchases` (
  `id` int(11) NOT NULL,
  `photo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','expired') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_codes`
--

CREATE TABLE `qr_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `qr_codes`
--

INSERT INTO `qr_codes` (`id`, `code`, `user_id`, `generated_by`, `created_at`, `expires_at`) VALUES
(1, '04c9bc0944db', 1, NULL, '2025-11-01 15:53:42', NULL),
(2, 'b078f3cc59bc', 1, 7, '2025-11-01 20:34:49', '2025-11-08 20:34:49'),
(3, '330e49fd5c9b', 3, 7, '2025-11-02 18:03:15', '2025-11-09 18:03:15'),
(4, '92461a40d79a', 5, 7, '2025-11-02 18:11:50', '2025-11-09 18:11:50'),
(5, '369d4c8fc3dd', 5, 7, '2025-11-02 20:13:56', '2025-11-09 20:13:56'),
(6, '690f69885c46', 3, 7, '2025-11-02 20:26:33', '2025-11-09 20:26:33'),
(7, 'b9c4cb197bc6', 3, 7, '2025-11-03 18:20:52', '2025-11-10 18:20:52');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `price`, `created_at`) VALUES
(1, 'Pro', NULL, 40.00, '2025-10-21 10:59:34'),
(2, 'Plus', NULL, 25.00, '2025-10-21 10:59:34'),
(3, 'Standard', NULL, 10.00, '2025-10-21 10:59:34');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','staff','admin') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `remaining_downloads` int(11) DEFAULT 0,
  `total_downloads` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `reset_token`, `reset_token_expires`, `remaining_downloads`, `total_downloads`) VALUES
(1, 'KC', 'kc@gmail.com', '$2b$10$BxU8kmtJ2X/URsxLLDPAle.pAoNaONvrMuHlJdccAPEgYBEBETNfi', 'customer', '2025-10-07 10:03:35', NULL, NULL, 0, 0),
(2, 'Test', 'test@gmail.com', '$2b$10$hSNtF2GTP1W5uXci57Oy9e0ghm4kow06iIjmLsluN4q/3Cn.NH5Bi', 'customer', '2025-10-08 08:16:10', NULL, NULL, 0, 0),
(3, 'Kester Clarence Abella', 'kcabella1611@gmail.com', '$2b$10$9I1qWY7jI7sobFNhOlVMbOswUhCUvI7F2ZZoLJnXZvcDGFkC9gZD6', 'customer', '2025-10-16 06:22:11', NULL, NULL, 0, 0),
(4, 'testaccount testes', 'rayseki1337@gmail.com', '$2b$10$PVZPqfl9WwKiBw5Uujh3o.uljwhhcbRhEqMHSCuxNRbnbZfA.iyaW', 'customer', '2025-10-21 05:53:13', 'dd44e78244b446ba64c992121e69d712a52f5765fdefc31f6017ffdc34f70c6f', '2025-10-22 19:52:03', 0, 0),
(5, 'KC Abella', 'kdabella7143val@student.fatima.edu.ph', '$2b$10$SS6lF9Y7JJano8NgE8UUke31B4Wkg6SZoqr81lyHisf6OP.aiHyP.', 'customer', '2025-11-01 07:10:10', NULL, NULL, 0, 0),
(7, 'Staff User', 'staff@gmail.com', '$2b$10$IMOYm7lwJ0pUe8HVGwoQvecMJd3vq6fLb9ilu6DqINaAnfCP/eeLm', 'staff', '2025-11-01 11:51:49', NULL, NULL, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_gallery`
--

CREATE TABLE `user_gallery` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `status` enum('available','purchased','expired') DEFAULT 'available',
  `upload_date` datetime DEFAULT current_timestamp(),
  `expiry_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_gallery`
--

INSERT INTO `user_gallery` (`id`, `user_id`, `photo_path`, `price`, `status`, `upload_date`, `expiry_date`) VALUES
(1, 1, '/uploads/sample.jpg', 100.00, 'available', '2025-10-23 23:42:59', '2025-10-30 23:42:59'),
(2, 1, '/public/images/soteras.png', 100.00, 'available', '2025-10-23 23:45:23', '2025-10-30 23:45:23'),
(3, 1, '/public/images/soteras.png', 100.00, 'available', '2025-10-23 23:47:05', '2025-10-30 23:47:05'),
(4, 1, '/images/soteras.png', 100.00, 'available', '2025-10-23 23:47:33', '2025-10-30 23:47:33'),
(5, 1, '/images/soteras.png', 100.00, 'available', '2025-10-23 23:54:29', '2025-10-30 23:54:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gallery_access_codes`
--
ALTER TABLE `gallery_access_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `photos`
--
ALTER TABLE `photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `photos_booking_fk` (`booking_id`),
  ADD KEY `photos_user_fk` (`user_id`);

--
-- Indexes for table `photo_purchases`
--
ALTER TABLE `photo_purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_photo_fk` (`photo_id`),
  ADD KEY `purchase_user_fk` (`user_id`);

--
-- Indexes for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_gallery`
--
ALTER TABLE `user_gallery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gallery_access_codes`
--
ALTER TABLE `gallery_access_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `photos`
--
ALTER TABLE `photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `photo_purchases`
--
ALTER TABLE `photo_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_gallery`
--
ALTER TABLE `user_gallery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `photos`
--
ALTER TABLE `photos`
  ADD CONSTRAINT `photos_booking_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `photos_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `photo_purchases`
--
ALTER TABLE `photo_purchases`
  ADD CONSTRAINT `purchase_photo_fk` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `user_gallery`
--
ALTER TABLE `user_gallery`
  ADD CONSTRAINT `user_gallery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
