/**
 * admin_edit_user.js — Save Changes modal confirmation
 * No inline scripts needed.
 */
(function () {
  var saveModal = null;

  var triggerBtn = document.getElementById('triggerSaveModal');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', function () {
      if (!saveModal) saveModal = new bootstrap.Modal(document.getElementById('saveConfirmModal'));
      saveModal.show();
    });
  }

  var confirmBtn = document.getElementById('confirmSaveBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      document.getElementById('editUserForm').submit();
    });
  }
}());
