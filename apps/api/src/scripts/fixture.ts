export function competitionFixture(now = Date.now()) {
  const day = 86400000;
  const videoUrl = '/media/demo-performance.mp4';
  return {
    slug: 'feedants-classical-dance',
    title: { en: 'Feedants Classical Dance', hi: 'फीडैंट्स शास्त्रीय नृत्य' },
    category: { en: 'Dance', hi: 'नृत्य' },
    status: 'published',
    capacity: 20,
    booked: 0,
    entryFee: 9900,
    registrationOpensAt: new Date(now - 4 * day),
    registrationClosesAt: new Date(now + day + 6 * 3600000 + 28 * 60000),
    submissionOpensAt: new Date(now - day),
    submissionClosesAt: new Date(now + 21 * day),
    resultsAt: new Date(now + 23 * day),
    judge: {
      name: 'Manju Dubey',
      role: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
      experience: { en: '12+ Years of Experience', hi: '12+ वर्षों का अनुभव' },
      photo: { x: 75, y: 334, width: 101, height: 101 },
      videoUrl,
    },
    about: {
      en: 'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.',
      hi: 'यह सभी आयु वर्गों के लिए एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है। कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ। पारंपरिक नृत्य के माध्यम से अपने जुनून को व्यक्त करें।',
    },
    aboutMore: {
      en: 'Bring your story to life through Kathak, Bharatanatyam, Odissi, Kuchipudi, or another Indian classical dance form. Submit one original solo performance of 1–5 minutes. Our judge reviews every eligible entry and recognises six outstanding performances. All times are shown in India Standard Time.',
      hi: 'कथक, भरतनाट्यम, ओडिसी, कुचिपुड़ी या किसी अन्य भारतीय शास्त्रीय नृत्य के माध्यम से अपनी कहानी प्रस्तुत करें। 1–5 मिनट का एक मौलिक एकल प्रदर्शन भेजें। हमारी निर्णायक छह उत्कृष्ट प्रदर्शनों को सम्मानित करेंगी। सभी समय भारतीय मानक समय में हैं।',
    },
    criteria: [
      { label: { en: 'Technique & precision', hi: 'तकनीक और सटीकता' }, weight: 35 },
      { label: { en: 'Expression & storytelling', hi: 'भाव और कहानी' }, weight: 30 },
      { label: { en: 'Rhythm & musicality', hi: 'ताल और संगीत' }, weight: 20 },
      { label: { en: 'Presentation & originality', hi: 'प्रस्तुति और मौलिकता' }, weight: 15 },
    ],
    rules: [
      {
        en: 'Open to all ages. Participants under 18 need a parent or guardian’s permission.',
        hi: 'सभी आयु वर्ग पात्र हैं। 18 वर्ष से कम उम्र वालों को अभिभावक की अनुमति चाहिए।',
      },
      {
        en: 'One solo entry per person. Upload an original 1–5 minute MP4, MOV, or WebM video, up to 50 MB.',
        hi: 'प्रति व्यक्ति एक एकल प्रविष्टि। 50 MB तक का 1–5 मिनट का मौलिक MP4, MOV या WebM वीडियो अपलोड करें।',
      },
      {
        en: 'Your face and full movement should be clearly visible. Use music you have permission to use.',
        hi: 'आपका चेहरा और पूरा नृत्य स्पष्ट दिखना चाहिए। केवल अधिकृत संगीत का उपयोग करें।',
      },
      {
        en: 'Only paid entries are eligible for judging. You may replace your submission until the deadline. The judge’s decision is final.',
        hi: 'केवल भुगतान की गई प्रविष्टियों का मूल्यांकन होगा। अंतिम तिथि तक वीडियो बदल सकते हैं। निर्णायक का निर्णय अंतिम होगा।',
      },
    ],
    rewards: [550, 300, 240, 200, 130, 80].map((amount, i) => ({
      position: i + 1,
      amount: amount * 100,
    })),
    winners: [
      { name: 'Riya Shah', position: 1, photo: { x: 58, y: 813, width: 92, height: 89 }, videoUrl },
      {
        name: 'Aarav Mehta',
        position: 1,
        photo: { x: 264, y: 814, width: 82, height: 86 },
        videoUrl,
      },
      {
        name: 'Neha Verma',
        position: 2,
        photo: { x: 458, y: 814, width: 85, height: 86 },
        videoUrl,
      },
      {
        name: 'Ishita Chopra',
        position: 3,
        photo: { x: 653, y: 814, width: 84, height: 86 },
        videoUrl,
      },
    ],
    testimonials: [
      {
        name: 'Riya Shah',
        quote: {
          en: 'A lovely opportunity to share my love for Kathak. The feedback helped me grow as a performer.',
          hi: 'कथक के प्रति अपना प्रेम साझा करने का सुंदर अवसर। प्रतिक्रिया ने मुझे बेहतर कलाकार बनने में मदद की।',
        },
        rating: 5,
      },
      {
        name: 'Aarav Mehta',
        quote: {
          en: 'Easy to participate from home, and the judging process felt thoughtful and fair.',
          hi: 'घर से भाग लेना आसान था और मूल्यांकन प्रक्रिया विचारशील और निष्पक्ष लगी।',
        },
        rating: 5,
      },
    ],
    refundPolicy: {
      en: 'Entry fees are refundable if Feedants cancels the competition. Once registered, voluntary withdrawals are not refundable. Contact support@feedants.com with your registration reference. This assignment uses simulated payments; no money is collected or refunded.',
      hi: 'फीडैंट्स द्वारा प्रतियोगिता रद्द करने पर प्रवेश शुल्क वापस होगा। स्वैच्छिक वापसी पर रिफंड नहीं मिलेगा। अपने पंजीकरण संदर्भ के साथ support@feedants.com से संपर्क करें। इस डेमो में वास्तविक धन नहीं लिया जाता।',
    },
    payoutInfo: {
      en: 'After results are announced, winners receive instructions to verify their identity and payout details. Prizes are transferred after verification. This is a demonstration: payouts and certificates are not issued.',
      hi: 'परिणामों के बाद विजेताओं को पहचान और भुगतान विवरण सत्यापित करने के निर्देश मिलेंगे। सत्यापन के बाद पुरस्कार भेजे जाएँगे। यह डेमो है: वास्तविक पुरस्कार या प्रमाणपत्र नहीं दिए जाते।',
    },
    payoutVideoUrl: videoUrl,
    referralReward: 1000,
  };
}
