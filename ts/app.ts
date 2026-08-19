// ============================================
// PaySat Login — Application Logic (TypeScript)
// ============================================

// --- Types ---
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
  emailTouched: boolean;
  passwordTouched: boolean;
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

// --- DOM References ---
const $ = <T extends HTMLElement>(selector: string): T | null =>
  document.querySelector<T>(selector);

const loginForm = $<HTMLFormElement>('#loginForm')!;
const emailInput = $<HTMLInputElement>('#emailInput')!;
const passwordInput = $<HTMLInputElement>('#passwordInput')!;
const passwordToggle = $<HTMLButtonElement>('#passwordToggle')!;
const rememberCheckbox = $<HTMLInputElement>('#rememberCheckbox')!;
const forgotLink = $<HTMLButtonElement>('#forgotLink')!;
const submitBtn = $<HTMLButtonElement>('#submitBtn')!;
const emailError = $<HTMLElement>('#emailError')!;
const passwordError = $<HTMLElement>('#passwordError')!;
const successOverlay = $<HTMLElement>('#successOverlay')!;
const modalBackdrop = $<HTMLElement>('#modalBackdrop')!;
const toastContainer = $<HTMLElement>('#toastContainer')!;

// --- State ---
const state: FormState = {
  email: '',
  password: '',
  rememberMe: false,
  emailTouched: false,
  passwordTouched: false,
};

let buttonState: ButtonState = 'idle';

// --- Validation ---
function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

function validateEmail(): string | null {
  const value = state.email.trim();
  if (!value) return 'Ingresa tu correo electrónico';
  if (!isValidEmail(value)) return 'Ingresa un correo electrónico válido';
  return null;
}

function validatePassword(): string | null {
  const value = state.password;
  if (!value) return 'Ingresa tu contraseña';
  if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  return null;
}

// --- UI Updates ---
function setFieldState(
  group: HTMLElement,
  errorEl: HTMLElement,
  state: 'idle' | 'error' | 'valid',
  message?: string
): void {
  group.classList.remove('error', 'valid', 'focused');

  if (state === 'error') {
    group.classList.add('error');
    const msgSpan = errorEl.querySelector('span');
    if (msgSpan) msgSpan.textContent = message || '';
    errorEl.classList.add('visible');
    errorEl.setAttribute('role', 'alert');
  } else if (state === 'valid') {
    group.classList.add('valid');
    errorEl.classList.remove('visible');
    errorEl.removeAttribute('role');
  } else {
    errorEl.classList.remove('visible');
    errorEl.removeAttribute('role');
  }
}

function updateEmailField(): void {
  const group = emailInput.closest('.form-group') as HTMLElement;
  if (!state.emailTouched) return;

  const error = validateEmail();
  if (error) {
    setFieldState(group, emailError, 'error', error);
  } else {
    setFieldState(group, emailError, 'valid');
  }
}

function updatePasswordField(): void {
  const group = passwordInput.closest('.form-group') as HTMLElement;
  if (!state.passwordTouched) return;

  const error = validatePassword();
  if (error) {
    setFieldState(group, passwordError, 'error', error);
  } else {
    setFieldState(group, passwordError, 'valid');
  }
}

// --- Password Toggle ---
function togglePasswordVisibility(): void {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';

  const showIcon = passwordToggle.querySelector('.icon-eye') as HTMLElement;
  const hideIcon = passwordToggle.querySelector('.icon-eye-off') as HTMLElement;

  if (showIcon && hideIcon) {
    showIcon.style.display = isPassword ? 'none' : 'block';
    hideIcon.style.display = isPassword ? 'block' : 'none';
  }

  passwordToggle.setAttribute(
    'aria-label',
    isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
  );
}

// --- Button States ---
function setButtonState(newState: ButtonState): void {
  buttonState = newState;
  submitBtn.classList.remove('loading', 'success', 'error');
  submitBtn.disabled = false;

  switch (newState) {
    case 'loading':
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      break;
    case 'success':
      submitBtn.classList.add('success');
      submitBtn.disabled = true;
      break;
    case 'error':
      submitBtn.classList.add('error');
      setTimeout(() => {
        if (buttonState === 'error') {
          submitBtn.classList.remove('error');
          buttonState = 'idle';
        }
      }, 1500);
      break;
  }
}

// --- Toast ---
function showToast(
  message: string,
  type: 'info' | 'success' | 'error' = 'info'
): void {
  const existing = toastContainer.querySelector('.toast');
  if (existing) existing.remove();

  const iconSvg = getToastIcon(type);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon ${type}">${iconSvg}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

function getToastIcon(type: string): string {
  switch (type) {
    case 'success':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    case 'error':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
}

// --- Success Overlay ---
function showSuccessOverlay(): void {
  successOverlay.classList.add('visible');
}

function hideSuccessOverlay(): void {
  successOverlay.classList.remove('visible');
}

// --- Forgot Password Modal ---
function openForgotModal(): void {
  modalBackdrop.classList.add('visible');
  document.body.style.overflow = 'hidden';

  const modalEmailInput = $<HTMLInputElement>('#modalEmailInput');
  if (modalEmailInput && state.email) {
    modalEmailInput.value = state.email;
  }
}

function closeForgotModal(): void {
  modalBackdrop.classList.remove('visible');
  document.body.style.overflow = '';
}

function handleForgotSubmit(): void {
  const modalEmailInput = $<HTMLInputElement>('#modalEmailInput');
  if (!modalEmailInput) return;

  const email = modalEmailInput.value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('Ingresa un correo electrónico válido', 'error');
    return;
  }

  closeForgotModal();
  setTimeout(() => {
    showToast('Te enviamos un enlace de recuperación', 'success');
  }, 300);
}

// --- Login Flow ---
async function handleLogin(): Promise<void> {
  // Touch all fields to trigger validation display
  state.emailTouched = true;
  state.passwordTouched = true;

  updateEmailField();
  updatePasswordField();

  const emailErr = validateEmail();
  const passwordErr = validatePassword();

  if (emailErr || passwordErr) {
    setButtonState('error');
    return;
  }

  // Simulate authentication
  setButtonState('loading');

  await delay(1200);

  setButtonState('success');

  await delay(600);

  showSuccessOverlay();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Event Handlers ---
function initEvents(): void {
  // Email input
  emailInput.addEventListener('input', () => {
    state.email = emailInput.value;
    if (state.emailTouched) updateEmailField();
  });

  emailInput.addEventListener('blur', () => {
    state.emailTouched = true;
    updateEmailField();
  });

  emailInput.addEventListener('focus', () => {
    const group = emailInput.closest('.form-group') as HTMLElement;
    group.classList.add('focused');
  });

  // Password input
  passwordInput.addEventListener('input', () => {
    state.password = passwordInput.value;
    if (state.passwordTouched) updatePasswordField();
  });

  passwordInput.addEventListener('blur', () => {
    state.passwordTouched = true;
    updatePasswordField();
  });

  passwordInput.addEventListener('focus', () => {
    const group = passwordInput.closest('.form-group') as HTMLElement;
    group.classList.add('focused');
  });

  // Password toggle
  passwordToggle.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility();
  });

  // Remember me
  rememberCheckbox.addEventListener('change', () => {
    state.rememberMe = rememberCheckbox.checked;
  });

  // Forgot password
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotModal();
  });

  // Modal backdrop click
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeForgotModal();
  });

  // Modal close button
  const modalCloseBtn = $<HTMLButtonElement>('#modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeForgotModal);
  }

  // Modal send button
  const modalSendBtn = $<HTMLButtonElement>('#modalSendBtn');
  if (modalSendBtn) {
    modalSendBtn.addEventListener('click', handleForgotSubmit);
  }

  // Form submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (buttonState !== 'idle') return;
    handleLogin();
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('visible')) {
      closeForgotModal();
    }
  });
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', initEvents);
