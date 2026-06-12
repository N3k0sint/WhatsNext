/**
 * profile.js — Profile page modal confirmations
 * No inline scripts needed — reads nothing from body attrs.
 */
(function () {
  var usernameModal = null;
  var passwordModal = null;

  function getOrCreate(id) {
    return new bootstrap.Modal(document.getElementById(id));
  }

  // "Update Username" button → show username confirm modal
  var usernameBtn = document.getElementById('triggerUsernameModal');
  if (usernameBtn) {
    usernameBtn.addEventListener('click', function () {
      if (!usernameModal) usernameModal = getOrCreate('usernameConfirmModal');
      usernameModal.show();
    });
  }

  // "Change Password" button → show password confirm modal
  var passwordBtn = document.getElementById('triggerPasswordModal');
  if (passwordBtn) {
    passwordBtn.addEventListener('click', function () {
      if (!passwordModal) passwordModal = getOrCreate('passwordConfirmModal');
      passwordModal.show();
    });
  }

  // Modal confirm buttons submit the corresponding forms
  var confirmUsernameBtn = document.getElementById('confirmUsernameBtn');
  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener('click', function () {
      document.getElementById('usernameForm').submit();
    });
  }

  var confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
  if (confirmPasswordBtn) {
    confirmPasswordBtn.addEventListener('click', function () {
      document.getElementById('passwordForm').submit();
    });
  }
}());
