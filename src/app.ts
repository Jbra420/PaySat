// ==============================================
// PaySat Login — Modular Auth Flow
// Selection -> Biometric / PIN / Password -> Success
// ==============================================

// --- Types ---

type LoginState = 'selection' | 'biometric' | 'pin' | 'password' | 'success';

interface AppState {
  currentStep: LoginState;
  pinDigits: string;
}

const PIN_LENGTH = 6;
const DEMO_USER = 'alejandro';
const DEMO_PIN = '123456';
const DEMO_PASS = 'password123';

// --- DOM References ---

function qs<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

// Containers
const stepSelection = qs<HTMLElement>('#stepSelection');
const stepBiometric = qs<HTMLElement>('#stepBiometric');
const stepPIN = qs<HTMLElement>('#stepPIN');
const stepPassword = qs<HTMLElement>('#stepPassword');
const stepSuccess = qs<HTMLElement>('#stepSuccess');

// Selection Actions
const btnGoBio = qs<HTMLButtonElement>('#btnGoBio');
const btnGoPIN = qs<HTMLButtonElement>('#btnGoPIN');
const btnGoPassword = qs<HTMLButtonElement>('#btnGoPassword');

// Back Buttons
const btnBackFromBio = qs<HTMLButtonElement>('#btnBackFromBio');
const btnBackFromPIN = qs<HTMLButtonElement>('#btnBackFromPIN');
const btnBackFromPassword = qs<HTMLButtonElement>('#btnBackFromPassword');

// Biometric UI
const bioIconWrap = qs<HTMLElement>('#bioIconWrap');
const bioStatus = qs<HTMLElement>('#bioStatus');

// PIN UI
const pinDots = qs<HTMLElement>('#pinDots');
const pinError = qs<HTMLElement>('#pinError');
const btnPinDelete = qs<HTMLButtonElement>('#btnPinDelete');

// Password UI
const passwordForm = qs<HTMLFormElement>('#passwordForm');
const usernameField = qs<HTMLElement>('#usernameField');
const passwordField = qs<HTMLElement>('#passwordField');
const usernameInput = qs<HTMLInputElement>('#usernameInput');
const passwordInput = qs<HTMLInputElement>('#passwordInput');
const btnSubmitPassword = qs<HTMLButtonElement>('#btnSubmitPassword');
const passwordGlobalError = qs<HTMLElement>('#passwordGlobalError');
const passwordGlobalErrorText = qs<HTMLElement>('#passwordGlobalErrorText');

// --- State & Navigation ---

const state: AppState = {
  currentStep: 'selection',
  pinDigits: '',
};

const stepMap: Record<LoginState, HTMLElement> = {
  selection: stepSelection,
  biometric: stepBiometric,
  pin: stepPIN,
  password: stepPassword,
  success: stepSuccess,
};

function navigateToStep(next: LoginState, reverse = false) {
  const currentEl = stepMap[state.currentStep];
  const nextEl = stepMap[next];

  if (currentEl === nextEl) return;

  if (reverse) {
    currentEl.classList.remove('step--active');
    nextEl.classList.remove('step--exit');
    nextEl.classList.add('step--active');
  } else {
    currentEl.classList.remove('step--active');
    currentEl.classList.add('step--exit');
    
    setTimeout(() => {
      currentEl.classList.remove('step--exit');
    }, 400);

    nextEl.classList.add('step--active');
  }

  state.currentStep = next;

  // Lifecycle hooks
  if (next === 'biometric') startBiometricScan();
  if (next === 'pin') resetPIN();
  if (next === 'password') resetPasswordForm();
}

// --- Biometric Logic ---

let bioTimeout: ReturnType<typeof setTimeout>;

function startBiometricScan() {
  clearTimeout(bioTimeout);
  bioIconWrap.parentElement?.classList.add('bio-verify--scanning');
  bioIconWrap.parentElement?.classList.remove('bio-verify--success');
  bioStatus.textContent = 'Mira la cámara o pon tu huella';

  // Simulate scan taking 2 seconds
  bioTimeout = setTimeout(() => {
    bioIconWrap.parentElement?.classList.remove('bio-verify--scanning');
    bioIconWrap.parentElement?.classList.add('bio-verify--success');
    bioStatus.textContent = 'Identidad confirmada';
    
    // Auto proceed to success after a brief pause
    setTimeout(() => {
      navigateToStep('success');
    }, 600);
  }, 2000);
}

function cancelBiometricScan() {
  clearTimeout(bioTimeout);
  bioIconWrap.parentElement?.classList.remove('bio-verify--scanning', 'bio-verify--success');
}

// --- PIN Logic ---

function updatePinUI() {
  const dots = Array.from(pinDots.querySelectorAll('.pin-dot'));
  
  dots.forEach((dot, index) => {
    if (index < state.pinDigits.length) {
      dot.classList.add('pin-dot--filled');
      dot.classList.remove('pin-dot--error');
    } else {
      dot.classList.remove('pin-dot--filled', 'pin-dot--error');
    }
  });

  pinError.classList.remove('pin-error--visible');
}

function showPinError() {
  const dots = Array.from(pinDots.querySelectorAll('.pin-dot'));
  dots.forEach(dot => {
    dot.classList.add('pin-dot--error');
    dot.classList.remove('pin-dot--filled');
  });
  pinError.classList.add('pin-error--visible');
}

function resetPIN() {
  state.pinDigits = '';
  updatePinUI();
}

function handlePinDigit(digit: string) {
  if (state.pinDigits.length >= PIN_LENGTH) return;

  state.pinDigits += digit;
  updatePinUI();

  if (state.pinDigits.length === PIN_LENGTH) {
    // Validate
    setTimeout(() => {
      if (state.pinDigits === DEMO_PIN) {
        navigateToStep('success');
      } else {
        showPinError();
        setTimeout(() => {
          resetPIN();
        }, 600);
      }
    }, 200);
  }
}

function handleDeletePin() {
  if (state.pinDigits.length > 0) {
    state.pinDigits = state.pinDigits.slice(0, -1);
    updatePinUI();
  }
}

// --- Password Logic ---

function resetPasswordForm() {
  usernameInput.value = '';
  passwordInput.value = '';
  usernameField.classList.remove('field--error');
  passwordField.classList.remove('field--error');
  passwordGlobalError.classList.remove('field__error--visible');
  setButtonLoading(btnSubmitPassword, false, 'Ingresar');
}

function handlePasswordSubmit(e: Event) {
  e.preventDefault();

  const user = usernameInput.value.trim().toLowerCase();
  const pass = passwordInput.value;

  // Clear errors
  usernameField.classList.remove('field--error');
  passwordField.classList.remove('field--error');
  passwordGlobalError.classList.remove('field__error--visible');

  // Simple validation
  if (!user || !pass) {
    if (!user) usernameField.classList.add('field--error');
    if (!pass) passwordField.classList.add('field--error');
    passwordGlobalErrorText.textContent = 'Completa todos los campos.';
    passwordGlobalError.classList.add('field__error--visible');
    return;
  }

  setButtonLoading(btnSubmitPassword, true);

  // Simulate network request
  setTimeout(() => {
    setButtonLoading(btnSubmitPassword, false, 'Ingresar');

    if (user === DEMO_USER && pass === DEMO_PASS) {
      navigateToStep('success');
    } else {
      passwordField.classList.add('field--error');
      passwordGlobalErrorText.textContent = 'Usuario o contraseña incorrectos.';
      passwordGlobalError.classList.add('field__error--visible');
    }
  }, 1000);
}

function setButtonLoading(btn: HTMLButtonElement, isLoading: boolean, text = '') {
  if (isLoading) {
    btn.classList.add('btn--loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn--loading');
    btn.disabled = false;
    if (text) {
      const textSpan = btn.querySelector('.btn__text');
      if (textSpan) textSpan.textContent = text;
    }
  }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  
  // Selection
  btnGoBio.addEventListener('click', () => navigateToStep('biometric'));
  btnGoPIN.addEventListener('click', () => navigateToStep('pin'));
  btnGoPassword.addEventListener('click', () => navigateToStep('password'));

  // Back Navigation
  btnBackFromBio.addEventListener('click', () => {
    cancelBiometricScan();
    navigateToStep('selection', true);
  });
  btnBackFromPIN.addEventListener('click', () => navigateToStep('selection', true));
  btnBackFromPassword.addEventListener('click', () => navigateToStep('selection', true));

  // PIN
  document.querySelectorAll('.numpad__key[data-key]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLButtonElement;
      handlePinDigit(el.getAttribute('data-key') || '');
    });
  });
  btnPinDelete.addEventListener('click', handleDeletePin);

  // Password
  passwordForm.addEventListener('submit', handlePasswordSubmit);
});
