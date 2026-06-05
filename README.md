# 🔐 StegoChat — CSS Steganography Web Messenger

A covert web chat application that hides encrypted messages inside CSS files using **End-of-Line (EOL) steganography** and **SHA-256 hashing**. To the outside world, it's just a stylesheet. Inside — it's a conversation.

---

## ✨ Features
- 🕵️ **CSS EOL Steganography** — messages embedded in stylesheet whitespace/line endings
- 🔒 **SHA-256 Encryption** — payload integrity and encryption handled in Python
- 📬 **Reach anyone** — start a chat using just an email or phone number
- 🔔 **Multi-channel notifications** — users get alerted via WhatsApp, SMS, or Email
- 🎨 **Blueberry Chat UI** — clean, dark-themed interface inspired by modern chat apps

---

## 🛠️ Tech Stack
- **Backend:** Python (steganography & crypto logic)
- **Encoding:** CSS End-of-Line (EOL) covert channel
- **Notifications:** WhatsApp API / SMS / Email
- **Frontend:** Web-based chat UI

---

## 🚀 How It Works
1. Operator adds a contact via email or phone number
2. Message is encrypted and embedded into a `.css` file
3. CSS file is transmitted as a normal stylesheet attachment
4. Recipient gets notified via WhatsApp/SMS/Email
5. Receiver decodes and decrypts the hidden payload

---

> 💡 Built as a mini project exploring applied cryptography and covert communication techniques.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install'
3. Run the app:
   `npm run dev`
