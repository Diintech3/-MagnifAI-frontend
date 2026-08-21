try {
  const lu = require('react-icons/lu');
  const icons = [
    'LuMegaphone',
    'LuExternalLink',
    'LuSettings',
    'LuLoader',
    'LuPlus',
    'LuRefreshCw',
    'LuCheck',
    'LuSend',
    'LuMessageSquare',
    'LuUserPlus',
    'LuEye',
    'LuEyeOff'
  ];
  icons.forEach(icon => {
    if (!lu[icon]) {
      console.log(`Icon missing: ${icon}`);
    } else {
      console.log(`Icon exists: ${icon}`);
    }
  });
} catch (err) {
  console.log("Error loading react-icons/lu:", err.message);
}
