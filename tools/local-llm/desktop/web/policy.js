(function (root) {
  'use strict';
  const policy = {
    pauseMs: 180000,
    shouldOffer(s, now) {
      return s.active && s.tutor?.phase !== 'complete' && !s.paused && s.record && s.proactive && s.coverage && s.studyVisible &&
        !s.modal && !s.busy && now >= s.cooldownUntil &&
        now - Math.max(s.lastActivity, s.visibleSince) >= 180000;
    },
    cooldown(response, now) { return now + (response === 'declined' ? 600000 : 300000); }
  };
  if (typeof module !== 'undefined') module.exports = policy;
  else root.CompanionPolicy = policy;
})(globalThis);
