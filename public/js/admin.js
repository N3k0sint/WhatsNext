/**
 * admin.js — Admin Panel: Delete Confirmation Modal
 *
 * SSDLC / CodeQL XSS-through-DOM fix:
 *   pendingDeleteId is parsed as a strict positive integer before being used
 *   in form.action. This prevents any attacker-controlled string from being
 *   injected into the DOM as HTML/URL. (CodeQL rule: js/xss-through-dom)
 *
 * No inline scripts — fully compliant with Content-Security-Policy (scriptSrc: 'self').
 */
(function () {
  var body      = document.body;
  var csrfToken = body.getAttribute('data-csrf');

  var pendingDeleteId = null; // stored as validated integer
  var deleteModal     = null;

  function getDeleteModal() {
    if (!deleteModal) {
      deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    }
    return deleteModal;
  }

  // Delegated click listener — catches all Delete buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;

    // CodeQL XSS-through-DOM fix: parse and validate as a positive integer
    // before storing or using in any DOM property (form.action).
    var rawId   = btn.getAttribute('data-user-id');
    var parsedId = parseInt(rawId, 10);

    // Reject if not a valid positive integer — do not proceed
    if (isNaN(parsedId) || parsedId <= 0 || String(parsedId) !== rawId.trim()) {
      console.error('Invalid user ID encountered — delete aborted.');
      return;
    }

    pendingDeleteId = parsedId; // now guaranteed to be a safe integer
    var username    = btn.getAttribute('data-username');

    // Use textContent (not innerHTML) to safely display username — prevents XSS
    document.getElementById('deleteUserName').textContent = username;
    getDeleteModal().show();
  });

  // Confirm Delete — construct action URL from validated integer only
  document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (!pendingDeleteId) return;

    var form = document.getElementById('deleteUserForm');
    var csrfInput = form.querySelector('input[name="_csrf"]');
    if (csrfInput) csrfInput.value = csrfToken;

    // Safe: pendingDeleteId is a validated integer, not an arbitrary DOM string
    form.action = '/admin/users/' + pendingDeleteId + '/delete';
    form.submit();
  });
}());
