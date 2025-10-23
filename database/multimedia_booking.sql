-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 24, 2025 at 12:53 AM
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
  `role` enum('customer','admin','staff') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `reset_token`, `reset_token_expires`) VALUES
(1, 'KC', 'kc@gmail.com', '$2b$10$BxU8kmtJ2X/URsxLLDPAle.pAoNaONvrMuHlJdccAPEgYBEBETNfi', 'customer', '2025-10-07 10:03:35', NULL, NULL),
(2, 'Test', 'test@gmail.com', '$2b$10$hSNtF2GTP1W5uXci57Oy9e0ghm4kow06iIjmLsluN4q/3Cn.NH5Bi', 'customer', '2025-10-08 08:16:10', NULL, NULL),
(3, 'Kester Clarence Abella', 'kcabella1611@gmail.com', '$2b$10$GnBCNbHvUHgnlxrnpAR7kOR5jwGLX1fX.69mtGyHRHuGjJsSwGz3m', 'customer', '2025-10-16 06:22:11', 'eabc84621a74e894017e3f78a578c98d061a80cff341b48605d9db3e6cd079e5', '2025-10-16 15:26:22'),
(4, 'testaccount testes', 'rayseki1337@gmail.com', '$2b$10$PVZPqfl9WwKiBw5Uujh3o.uljwhhcbRhEqMHSCuxNRbnbZfA.iyaW', 'customer', '2025-10-21 05:53:13', 'dd44e78244b446ba64c992121e69d712a52f5765fdefc31f6017ffdc34f70c6f', '2025-10-22 19:52:03');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
