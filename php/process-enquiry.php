<?php
declare(strict_types=1);

/**
 * process-enquiry.php
 * - Verifies Cloudflare Turnstile server-side
 * - Validates/sanitizes fields
 * - Routes to a branch email (optional)
 * - Sends email via PHP mail()
 *
 * IMPORTANT:
 * - Replace TURNSTILE_SECRET with your real secret key
 * - Replace branch emails (or set a single fallback email)
 */

// ------------------------------
// CONFIG
// ------------------------------
const TURNSTILE_SECRET = '0x4AAAAAAB1HfqliNHqJNnYwcsIi0CeDaUo';

// Where to send enquiries if branch not found:
const FALLBACK_TO_EMAIL = 'brad@nhg.za.net';

// Optional: set a "From" address on your domain (recommended for deliverability)
const FROM_EMAIL = 'brad@nhg.za.net';
const FROM_NAME  = 'Northern Hardware & Glass Website';

// Redirect back to the SAME page with query params (no separate thank-you page)
const SUCCESS_REDIRECT = 'contact.html?success=1';
const ERROR_REDIRECT   = 'contact.html?error=1';

// Map branch names (from your <select>) to destination emails:
$BRANCH_EMAILS = [
  'Midrand'         => 'brad@nhg.za.net',
  'Pretoria'        => 'warren@nhg.co.za',
  'Tzaneen'         => 'marinda@nhg.co.za',
  'Mokopane'        => 'sales@nhg.za.net',
  'Polokwane'       => 'pbg@nhg.za.net',
  'Groblersdal'     => 'sunette@nhg.co.za',
  'Jane Furse'      => 'janefurse@nhg.co.za',
  'Louis Trichardt' => 'ltt@nhg.za.net',
  'Mankweng'        => 'mankweng@nhg.co.za',
  'Thohoyandou'     => 'sibasa@nhg.co.za',
  'Kwaggafontein'   => 'kwagga@nhg.co.za',
];

// ------------------------------
// HELPERS
// ------------------------------
function redirect(string $url): void {
  header('Location: ' . $url, true, 302);
  exit;
}

function clean_line(string $s): string {
  // Prevent header injection (strip CR/LF)
  return trim(str_replace(["\r", "\n"], ' ', $s));
}

function post(string $key): string {
  return isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
}

// ------------------------------
// ONLY ALLOW POST
// ------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  redirect(ERROR_REDIRECT);
}

// ------------------------------
// TURNSTILE VERIFY
// ------------------------------
$turnstileToken = post('cf-turnstile-response');
if ($turnstileToken === '') {
  redirect(ERROR_REDIRECT);
}

// Collect visitor IP if available (helps Turnstile)
$remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';

$verifyPayload = http_build_query([
  'secret'   => TURNSTILE_SECRET,
  'response' => $turnstileToken,
  'remoteip' => $remoteIp,
]);

$ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => $verifyPayload,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT        => 10,
  CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
]);

$verifyResponse = curl_exec($ch);
$httpCode       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($verifyResponse === false || $httpCode !== 200) {
  // Verification call failed
  redirect(ERROR_REDIRECT);
}

$verifyJson = json_decode($verifyResponse, true);
if (!is_array($verifyJson) || empty($verifyJson['success'])) {
  // Turnstile says no
  redirect(ERROR_REDIRECT);
}

// ------------------------------
// READ + VALIDATE FIELDS
// ------------------------------
$name    = clean_line(post('name'));
$email   = clean_line(post('email'));
$phone   = clean_line(post('phone'));
$branch  = clean_line(post('branch'));
$subject = clean_line(post('subject'));
$message = trim(post('message'));
$optIn   = post('marketing_opt_in') === 'yes' ? 'Yes' : 'No';

if ($name === '' || $email === '' || $branch === '' || $message === '') {
  redirect(ERROR_REDIRECT);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  redirect(ERROR_REDIRECT);
}

// Subject fallback
if ($subject === '') {
  $subject = 'Website enquiry';
}

// Resolve destination email
$toEmail = $BRANCH_EMAILS[$branch] ?? FALLBACK_TO_EMAIL;

// ------------------------------
// BUILD EMAIL
// ------------------------------
$ip = $remoteIp ?: 'Unknown';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

$emailSubject = "Enquiry: {$subject} ({$branch})";

$bodyLines = [
  "New website enquiry received",
  "----------------------------",
  "Branch: {$branch}",
  "Name: {$name}",
  "Email: {$email}",
  "Phone: {$phone}",
  "Marketing opt-in: {$optIn}",
  "",
  "Message:",
  $message,
  "",
  "Meta:",
  "IP: {$ip}",
  "User-Agent: {$ua}",
];

$body = implode("\n", $bodyLines);

// Headers
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Content-Type-Options: nosniff';

// Send
$ok = mail($toEmail, $emailSubject, $body, implode("\r\n", $headers));

if (!$ok) {
  redirect(ERROR_REDIRECT);
}

// Success (back to contact page)
redirect(SUCCESS_REDIRECT);
