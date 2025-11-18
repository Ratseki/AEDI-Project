-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 16, 2025 at 06:25 PM
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
(1, 3, 2, '2025-11-06', 'confirmed', '2025-11-06 02:35:10', 'John', 'Doe', 'john@example.com', '02', '1234567', 'Basic Package', 'No note', 2, '10:00', 'Main Studio'),
(15, 3, 2, '2025-10-16', 'pending', '2025-10-22 07:17:06', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 2, '09:00', NULL),
(16, 3, 2, '2025-10-15', 'paid', '2025-10-22 08:05:56', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 4, '09:00', NULL),
(17, 3, 1, '2025-10-16', 'pending', '2025-10-22 09:00:42', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 5, '12:00', NULL),
(18, 3, 1, '2025-10-16', 'pending', '2025-10-22 09:01:26', 'KC', 'AB', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 5, '12:00', NULL),
(22, 3, 2, '2025-10-16', 'pending', '2025-10-22 09:56:47', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 3, '15:00', NULL),
(23, 3, 2, '2025-10-24', 'pending', '2025-10-22 10:52:36', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', 'yes', 3, '10:00', NULL),
(24, 3, 1, '2025-10-15', 'paid', '2025-10-22 14:18:25', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '15:00', NULL),
(25, 3, 1, '2025-10-24', 'pending', '2025-10-22 14:54:36', 'KC', 'AB', 'test123@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 4, '16:00', NULL),
(26, 3, 1, '2025-10-14', 'paid', '2025-10-22 14:55:19', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 3, '16:00', NULL),
(27, 3, 3, '2025-10-17', 'pending', '2025-10-22 15:30:23', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Standard — $10', 'yes', 3, '13:00', NULL),
(28, 3, 1, '2025-10-14', 'paid', '2025-10-22 16:01:42', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 2, '13:00', NULL),
(29, 3, 1, '2025-10-10', 'cancelled', '2025-10-22 16:02:54', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — $40', 'yes', 3, '14:00', NULL),
(30, 1, 1, '2025-10-23', 'confirmed', '2025-10-23 16:06:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL),
(35, 3, 2, '2025-11-14', 'pending', '2025-11-04 02:02:22', 'KC', 'Abella', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — $25', '3', 2, '15:00', NULL),
(36, 3, 1, '2025-11-06', 'pending', '2025-11-04 11:04:36', 'KC', 'Abella', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, NULL, '10:00', NULL),
(37, 3, 3, '2025-11-06', 'pending', '2025-11-04 11:05:37', 'KC', 'Abella', 'rayseki1337@gmail.com', '3019', '09167406636', 'Standard — ₱10', NULL, NULL, '10:00', NULL),
(38, 3, 1, '2025-11-06', 'pending', '2025-11-04 11:05:50', 'KC', 'Abella', 'rayseki1337@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, NULL, '10:00', NULL),
(39, 3, 3, '2025-11-06', 'pending', '2025-11-04 11:06:14', 'KC', 'Abella', 'rayseki1337@gmail.com', '3019', '09167406636', 'Standard — ₱10', NULL, NULL, '10:00', NULL),
(40, 3, 3, '2025-11-06', 'pending', '2025-11-04 11:10:20', 'KC', 'Abella', 'rayseki1337@gmail.com', '3019', '09167406636', 'Standard — ₱10', NULL, NULL, '10:00', NULL),
(41, 3, 1, '2025-11-14', 'pending', '2025-11-05 11:52:46', 'KC', 'Abella', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, NULL, '10:00', NULL),
(42, 3, 1, '2025-11-14', 'cancelled', '2025-11-06 02:17:01', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, NULL, '14:00', NULL),
(43, 3, 1, '2025-11-20', 'pending', '2025-11-12 02:00:36', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, NULL, '11:00', NULL),
(44, 3, 2, '2025-11-20', 'pending', '2025-11-12 02:02:05', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Plus — ₱25', NULL, NULL, '12:00', NULL),
(45, 3, 1, '2025-11-18', 'pending', '2025-11-13 01:42:06', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Pro — ₱40', NULL, 1, '11:00', 'Paoay, Ilocos Norte'),
(46, 3, 3, '2025-11-20', 'pending', '2025-11-16 16:21:01', 'KC', 'AB', 'kcabella1611@gmail.com', '3019', '09167406636', 'Standard — ₱10', NULL, 1, '12:00', 'Paoay, Ilocos Norte');

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
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 8, 'Test Notification', 'The notification system is working!', 'info', 0, '2025-11-16 15:52:39');

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `amount`, `status`, `created_at`, `is_downpayment`) VALUES
(1, 28, 500.00, 'downpayment', '2025-11-16 15:35:06', 1),
(2, 26, 35023.00, 'downpayment', '2025-11-16 15:35:45', 1),
(3, 26, 40.00, 'downpayment', '2025-11-16 15:42:39', 1),
(4, 28, 40.00, 'downpayment', '2025-11-16 15:42:42', 1),
(5, 24, 40.00, 'downpayment', '2025-11-16 15:42:46', 1),
(6, 24, 40.00, 'downpayment', '2025-11-16 15:42:54', 1);

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
(31, NULL, 1, 7, '', '/uploads/1762000415075.png', NULL, '2025-11-01 12:33:35', 1, 100.00, 'available', NULL, NULL, '2025-11-01 20:33:35'),
(36, NULL, 5, 7, 'horse.jpg', '/uploads/1762078603646.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(37, NULL, 5, 7, '360_F_487659230_LIQIuM4OtZLTJ4juqUAfyZL24muRatdZ.jpg', '/uploads/1762078603651.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(38, NULL, 5, 7, '7-ortoneffectkcab.jpg', '/uploads/1762078603652.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(40, NULL, 5, 7, '475725406_2302902623416837_6374635398458049863_n.jpg', '/uploads/1762078603678.jpg', NULL, '2025-11-02 10:16:43', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:16:43'),
(41, NULL, 5, 7, 'network-addressing-and-basic-troubleshooting(1).png', '/uploads/1762078654449.png', NULL, '2025-11-02 10:17:34', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:17:34'),
(42, NULL, 5, 7, 'network-addressing-and-basic-troubleshooting(1).png', '/uploads/1762078761894.png', NULL, '2025-11-02 10:19:21', 1, 100.00, 'purchased', NULL, '2025-11-06 10:17:16', '2025-11-02 18:19:21'),
(43, NULL, 5, 7, 'mesozoicomap2.png', '/uploads/1762078785061.png', NULL, '2025-11-02 10:19:45', 1, 100.00, 'available', NULL, NULL, '2025-11-02 18:19:45'),
(83, NULL, 3, 7, 'togif.gif', '/uploads/1762165272831.gif', NULL, '2025-11-03 10:21:12', 1, 100.00, 'purchased', NULL, '2025-11-05 20:08:37', '2025-11-03 18:21:12'),
(84, NULL, 1, 8, 'Dr_Andrew_Huberman.jpg', '/uploads/1762241156208.jpg', NULL, '2025-11-04 07:25:56', 1, 100.00, 'available', NULL, NULL, '2025-11-04 15:25:56'),
(86, NULL, 3, 7, 'i-recolored-the-chromakopia-cover-art-for-fun-v0-jai8vr2dpivd1.png', '/uploads/1762391769397.png', NULL, '2025-11-06 01:16:09', 1, 100.00, 'available', NULL, NULL, '2025-11-06 09:16:09'),
(87, NULL, 3, 7, 'noFilter.webp', '/uploads/1762391769399.webp', NULL, '2025-11-06 01:16:09', 1, 100.00, 'available', NULL, NULL, '2025-11-06 09:16:09'),
(88, NULL, 3, 7, 'KCABpfp.png', '/uploads/1762391769400.png', NULL, '2025-11-06 01:16:09', 1, 100.00, 'purchased', NULL, '2025-11-06 10:54:52', '2025-11-06 09:16:09'),
(89, NULL, 3, 7, 'i-recolored-the-chromakopia-cover-art-for-fun-v0-jai8vr2dpivd1.png', '/uploads/1762391769409.png', NULL, '2025-11-06 01:16:09', 1, 100.00, 'purchased', NULL, '2025-11-06 19:42:22', '2025-11-06 09:16:09'),
(90, NULL, 3, 7, 'noFilter.webp', '/uploads/1762391769411.webp', NULL, '2025-11-06 01:16:09', 1, 100.00, 'purchased', NULL, '2025-11-06 19:51:43', '2025-11-06 09:16:09'),
(91, NULL, 3, 7, 'KCABpfp.png', '/uploads/1762391769411.png', NULL, '2025-11-06 01:16:09', 1, 100.00, 'purchased', NULL, '2025-11-06 19:55:19', '2025-11-06 09:16:09'),
(116, NULL, 3, 7, 'meditate2.png', '/uploads/1762397333175.png', NULL, '2025-11-06 02:48:53', 1, 100.00, 'available', NULL, NULL, '2025-11-06 10:48:53'),
(117, NULL, 3, 8, 'chromakopia-pfp-05.jpg', '/uploads/1762428462653.jpg', NULL, '2025-11-06 11:27:42', 1, 470.00, 'available', NULL, NULL, '2025-11-06 19:27:42'),
(118, NULL, 3, 8, 'photo_90-1.webp', '/uploads/1762447609635.webp', NULL, '2025-11-06 16:46:49', 1, 100.00, 'purchased', NULL, '2025-11-07 00:47:38', '2025-11-07 00:46:49'),
(119, 1, 5, 8, '1980s_lab_03-100608911-large.png', '/uploads/1763305984841.png', NULL, '2025-11-16 15:13:04', 1, 100.00, 'available', NULL, NULL, '2025-11-16 23:13:04');

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
  `downloads_remaining` int(11) DEFAULT 7,
  `price` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','expired') DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `photo_purchases`
--

INSERT INTO `photo_purchases` (`id`, `photo_id`, `user_id`, `purchase_date`, `expires_at`, `downloads_remaining`, `price`, `status`, `created_at`) VALUES
(56, 90, 3, '2025-11-06 11:55:00', NULL, 7, 0.00, 'active', '2025-11-06 19:55:00'),
(57, 91, 3, '2025-11-06 11:55:05', NULL, 10, 100.00, '', '2025-11-06 19:55:05'),
(58, 118, 3, '2025-11-06 16:47:28', NULL, 10, 100.00, '', '2025-11-07 00:47:28'),
(59, 117, 3, '2025-11-06 16:47:46', NULL, 10, 470.00, '', '2025-11-07 00:47:46'),
(60, 116, 3, '2025-11-06 16:47:46', NULL, 10, 100.00, '', '2025-11-07 00:47:46'),
(61, 86, 3, '2025-11-06 16:47:46', NULL, 10, 100.00, '', '2025-11-07 00:47:46'),
(62, 87, 3, '2025-11-06 16:47:46', NULL, 10, 100.00, '', '2025-11-07 00:47:46'),
(63, 117, 3, '2025-11-06 16:47:56', NULL, 10, 470.00, '', '2025-11-07 00:47:56'),
(64, 116, 3, '2025-11-06 16:47:56', NULL, 10, 100.00, '', '2025-11-07 00:47:56'),
(65, 86, 3, '2025-11-06 16:47:56', NULL, 10, 100.00, '', '2025-11-07 00:47:56'),
(66, 87, 3, '2025-11-06 16:47:56', NULL, 10, 100.00, '', '2025-11-07 00:47:56'),
(67, 87, 3, '2025-11-06 16:50:27', NULL, 10, 100.00, '', '2025-11-07 00:50:27'),
(68, 86, 3, '2025-11-06 16:50:27', NULL, 10, 100.00, '', '2025-11-07 00:50:27'),
(69, 117, 3, '2025-11-12 01:49:48', NULL, 10, 470.00, '', '2025-11-12 09:49:48'),
(70, 117, 3, '2025-11-12 02:02:44', NULL, 10, 470.00, '', '2025-11-12 10:02:44'),
(71, 87, 3, '2025-11-12 02:02:51', NULL, 10, 100.00, '', '2025-11-12 10:02:51'),
(72, 43, 3, '2025-11-16 16:01:39', NULL, 10, 100.00, '', '2025-11-17 00:01:39'),
(73, 41, 3, '2025-11-16 16:01:39', NULL, 10, 100.00, '', '2025-11-17 00:01:39'),
(74, 84, 3, '2025-11-16 16:01:39', NULL, 10, 100.00, '', '2025-11-17 00:01:39'),
(75, 86, 3, '2025-11-16 16:01:39', NULL, 10, 100.00, '', '2025-11-17 00:01:39'),
(76, 87, 3, '2025-11-16 16:02:56', NULL, 10, 100.00, '', '2025-11-17 00:02:56'),
(77, 43, 3, '2025-11-16 16:03:06', NULL, 10, 100.00, '', '2025-11-17 00:03:06'),
(78, 43, 3, '2025-11-16 16:03:07', NULL, 10, 100.00, '', '2025-11-17 00:03:07'),
(79, 117, 3, '2025-11-16 16:49:03', NULL, 7, 470.00, '', '2025-11-17 00:49:03'),
(80, 117, 3, '2025-11-16 16:49:04', NULL, 7, 470.00, '', '2025-11-17 00:49:04'),
(81, 116, 3, '2025-11-16 16:49:45', NULL, 7, 100.00, '', '2025-11-17 00:49:45'),
(82, 117, 3, '2025-11-16 17:14:26', NULL, 7, 470.00, '', '2025-11-17 01:14:26'),
(83, 117, 3, '2025-11-16 17:14:58', NULL, 7, 470.00, '', '2025-11-17 01:14:58'),
(84, 117, 3, '2025-11-16 17:15:19', NULL, 7, 470.00, '', '2025-11-17 01:15:19'),
(85, 84, 3, '2025-11-16 17:19:16', NULL, 7, 100.00, '', '2025-11-17 01:19:16'),
(86, 117, 3, '2025-11-16 17:22:27', NULL, 7, 470.00, '', '2025-11-17 01:22:27'),
(87, 117, 3, '2025-11-16 17:23:53', NULL, 7, 470.00, '', '2025-11-17 01:23:53'),
(88, 117, 3, '2025-11-16 17:24:02', NULL, 10, 470.00, '', '2025-11-17 01:24:02');

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
(7, 'b9c4cb197bc6', 3, 7, '2025-11-03 18:20:52', '2025-11-10 18:20:52'),
(8, 'e39ed70f0f27', 5, 7, '2025-11-04 15:18:20', '2025-11-11 15:18:20'),
(9, 'b6aed218bf36', 5, 7, '2025-11-04 15:18:21', '2025-11-11 15:18:21'),
(10, 'd66e2767c869', 5, 7, '2025-11-04 15:18:22', '2025-11-11 15:18:22'),
(11, '1ddc6f8bff9d', 5, 7, '2025-11-04 15:18:22', '2025-11-11 15:18:22'),
(12, '4d1e16c2004a', 5, 7, '2025-11-04 15:18:23', '2025-11-11 15:18:23'),
(13, 'f25698295ff9', 5, 7, '2025-11-04 15:18:23', '2025-11-11 15:18:23'),
(14, '61971b59533b', 5, 7, '2025-11-04 15:18:23', '2025-11-11 15:18:23'),
(15, '00ed7e3fd476', 5, 7, '2025-11-04 15:18:23', '2025-11-11 15:18:23'),
(16, '095a9e9ec62a', 3, 8, '2025-11-04 15:26:20', '2025-11-11 15:26:20'),
(17, 'e0eba20ca6de', 5, 8, '2025-11-04 15:31:49', '2025-11-11 15:31:49'),
(18, 'fceec8b21c25', 1, 8, '2025-11-04 15:33:39', '2025-11-11 15:33:39'),
(19, '13de1681f9c9', 5, 8, '2025-11-04 15:35:41', '2025-11-11 15:35:41'),
(20, '39eeaa300792', 1, 8, '2025-11-05 18:11:32', '2025-11-12 18:11:32'),
(21, '9bda49696f89', 3, 8, '2025-11-16 23:14:21', '2025-11-23 23:14:21'),
(22, '3721a29bf04d', 5, 8, '2025-11-16 23:22:27', '2025-11-23 23:22:27');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `booking_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `service_id`, `rating`, `comment`, `created_at`, `booking_id`) VALUES
(1, 3, 2, 5, 'wow 5/5 very naise 👍👎', '2025-11-16 16:35:41', NULL),
(2, 3, 2, 5, 'good 5/5 very naise 👍👎', '2025-11-16 16:41:41', 1);

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
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `type` enum('photo','booking') NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` enum('pending','confirmed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `reference_id`, `type`, `related_id`, `amount`, `payment_method`, `status`, `created_at`) VALUES
(1, 3, 'pay_j67TkdXBqkCK5gb9mEvCienr', 'photo', 83, 100.00, 'gcash', 'confirmed', '2025-11-05 12:08:37'),
(2, 1, 'pay_BBKDEVXfB2s3jwGR2fSiti3s', 'photo', 42, 2320.00, 'gcash', 'confirmed', '2025-11-06 02:17:16'),
(3, 3, 'pay_PsDKMM7j4FgWWputCLPVS2PM', 'photo', 88, 100.00, 'gcash', 'confirmed', '2025-11-06 02:54:52'),
(4, 3, 'pay_YBNVsKhnnuVQnDUkPGHeqVQu', 'photo', 89, 100.00, 'gcash', 'confirmed', '2025-11-06 11:42:22'),
(5, 3, 'pay_CyS9awiCis32pAxjaEQMhYqj', 'photo', 90, 100.00, 'gcash', 'confirmed', '2025-11-06 11:51:43'),
(6, 3, 'pay_Xw9aciSG2DXfDbJ3eSkrgaUx', 'photo', 91, 100.00, 'gcash', 'confirmed', '2025-11-06 11:55:19'),
(7, 3, 'pay_VyAwBhhLym9WZ4GgMtSSzS9q', 'photo', 118, 100.00, 'gcash', 'confirmed', '2025-11-06 16:47:38'),
(8, 1, 'pay_FJ9A3wpn5yUUL7JC3jqW8sM9', 'photo', 3, 100.00, 'gcash', 'confirmed', '2025-11-06 16:48:07'),
(9, 3, 'BOOKING-KGNPXFG', 'booking', 28, 500.00, 'cash', 'confirmed', '2025-11-16 15:35:06'),
(10, 3, 'BOOKING-XKEIEIK', 'booking', 26, 35023.00, 'cash', 'confirmed', '2025-11-16 15:35:45'),
(11, 3, 'BOOKING-XEXA6F0', 'booking', 26, 40.00, 'cash', 'confirmed', '2025-11-16 15:42:39'),
(12, 3, 'BOOKING-9FIWGZF', 'booking', 28, 40.00, 'cash', 'confirmed', '2025-11-16 15:42:42'),
(13, 3, 'BOOKING-4GGPOYY', 'booking', 24, 40.00, 'cash', 'confirmed', '2025-11-16 15:42:46'),
(14, 3, 'BOOKING-OWPFXDP', 'booking', 24, 40.00, 'cash', 'confirmed', '2025-11-16 15:42:54'),
(15, 3, 'DL-LDT0IC3', 'photo', 90, 0.00, 'download', 'confirmed', '2025-11-16 16:03:26'),
(16, 3, 'DL-CRPTYKU', 'photo', 90, 0.00, 'download', 'confirmed', '2025-11-16 16:04:30'),
(17, 3, 'DL-OZMFYLP', 'photo', 90, 0.00, 'download', 'confirmed', '2025-11-16 16:05:52'),
(18, 3, 'BOOKING-A1Q2R9J', 'booking', 26, 5.00, 'cash', 'confirmed', '2025-11-16 16:14:44'),
(19, 3, 'BOOKING-MLDH8YR', 'booking', 16, 520.00, 'cash', 'confirmed', '2025-11-16 16:14:52'),
(20, 3, 'BOOKING-IXI5UYQ', 'booking', 28, 200.00, 'cash', 'confirmed', '2025-11-16 16:48:17'),
(21, 3, 'BOOKING-XHKI8EH', 'booking', 24, 200.00, 'cash', 'confirmed', '2025-11-16 16:48:27'),
(22, 3, 'DL-092QQZ4', 'photo', 90, 0.00, 'download', 'confirmed', '2025-11-16 16:49:27'),
(23, 3, 'DL-39SARNL', 'photo', 90, 0.00, 'download', 'confirmed', '2025-11-16 16:50:44');

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
  `total_downloads` int(11) DEFAULT 0,
  `contact` varchar(20) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT 'Other',
  `dob` date DEFAULT '2000-01-01',
  `profile_pic` varchar(255) DEFAULT '/assets/default-avatar.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `reset_token`, `reset_token_expires`, `remaining_downloads`, `total_downloads`, `contact`, `gender`, `dob`, `profile_pic`) VALUES
(1, 'KC', 'kc@gmail.com', '$2b$10$BxU8kmtJ2X/URsxLLDPAle.pAoNaONvrMuHlJdccAPEgYBEBETNfi', 'customer', '2025-10-07 10:03:35', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(3, 'Kester Clarence Abella', 'kcabella1611@gmail.com', '$2b$10$hNJzey/TLW0R6D6.JjcnIuBAuACTh1AdoAqBcaD.Rr6BpAwlthSSO', 'customer', '2025-10-16 06:22:11', NULL, NULL, 0, 0, '09167406636', 'Female', '2004-10-23', '/uploads/profile_pics/profile_3.webp'),
(5, 'KC Abella', 'kdabella7143val@student.fatima.edu.ph', '$2b$10$SS6lF9Y7JJano8NgE8UUke31B4Wkg6SZoqr81lyHisf6OP.aiHyP.', 'customer', '2025-11-01 07:10:10', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(7, 'Staff User', 'staff@gmail.com', '$2b$10$IMOYm7lwJ0pUe8HVGwoQvecMJd3vq6fLb9ilu6DqINaAnfCP/eeLm', 'staff', '2025-11-01 11:51:49', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(8, 'Admin User', 'admin@gmail.com', '$2b$10$YpOpgMSCtaDug9d4IW3PX.XZ1BcpxcHzucAXn76tU93PDdVNyvi3G', 'admin', '2025-11-04 07:24:45', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL);

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
  ADD KEY `idx_user_published` (`user_id`,`is_published`);

--
-- Indexes for table `photo_purchases`
--
ALTER TABLE `photo_purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_photo_fk` (`photo_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`);

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
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `photos`
--
ALTER TABLE `photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `photo_purchases`
--
ALTER TABLE `photo_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_gallery`
--
ALTER TABLE `user_gallery`
  ADD CONSTRAINT `user_gallery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
