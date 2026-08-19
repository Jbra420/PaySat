// ==============================================
// PaySat Login — Application Logic
// Progressive authentication: Identify → Authenticate → Access
// ==============================================

// --- Types ---

type AuthMethod = 'biometric' | 'pin' | 'other';

type LoginState =
  | 'identifier'
  | 'methods'
  | 'pin'
  | 'biometric'
  | 'loading'
  | 'success'
  | 'error';

interface DemoUser {
  identifier: string;
  name: string;
  pin: string;
  initial: string;
}

interface AppState {
  currentStep: LoginState;
  previousStep: LoginState | null;
  identifier: string;
  identifierTouched: boolean;
  pinDigits: string;
  currentUser: DemoUser | null;
}

// --- Demo Data (replaceable by API) ---

const DEMO_USERS: DemoUser[] = [
  {
    identifier: 'alejandro',
    name: 'Alejandro',
    pin: '123456',
    initial: 'A',
  },
];

const PIN_LENGTH = 6;

// --- DOM References ---

function qs<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

// Step containers
const stepIdentifier = qs<HTMLElement>('#stepIdentifier');
const stepMethods = qs<HTMLElement>('#stepMethods');
const stepPIN = qs<HTMLElement>('#stepPIN');
const stepBiometric = qs<HTMLElement>('#stepBiometric');
const stepSuccess = qs<HTMLElement>('#stepSuccess');

// Identifier step
const identifierForm = qs<HTMLFormElement>('#identifierForm');
const identifierInput = qs<HTMLInputElement>('#identifierInput');
const identifierField = qs<HTMLElement>('#identifierField');
const identifierError = qs<HTMLElement>('#identifierError');
const btnContinue = qs<HTMLButtonElement>('#btnContinue');
const btnBioShortcut = qs<HTMLButtonElement>('#btnBioShortcut');

// Methods step
const btnBackMethods = qs<HTMLButtonElement>('#btnBackMethods');
const btnMethodBio = qs<HTMLButtonElement>('#btnMethodBio');
const btnMethodPIN = qs<HTMLButtonElement>('#btnMethodPIN');
const btnMethodOther = qs<HTMLButtonElement>('#btnMethodOther');
const userAvatar = qs<HTMLElement>('#userAvatar');
const userName = qs<HTMLElement>('#userName');

// PIN step
const btnBackPIN = qs<HTMLButtonElement>('#btnBackPIN');
const pinDots = qs<HTMLElement>('#pinDots');
const pinError = qs<HTMLElement>('#pinError');
const btnPinDelete = qs<HTMLButtonElement>('#btnPinDelete');

// Biometric step
const btnBackBio = qs<HTMLButtonElement>('#btnBackBio');
const bioIconWrap = qs<HTMLElement>('#bioIconWrap');
const bioStatus = qs<HTMLElement>('#bioStatus');
const btnBioFallback = qs<HTMLButtonElement>('#btnBioFallback');

// --- State ---

const state: AppState = {
  currentStep: 'identifier',
  previousStep: null,
  identifier: '',
  identifierTouched: false,
  pinDigits: '',
  currentUser: null,
};

// --- Step Map ---

const stepMap: Record<LoginState, HTMLElement> = {
  identifier: stepIdentifier,
  methods: stepMethods,
  pin: stepPIN,
  biometric: stepBiometric,
  loading: stepIdentifier, // loading uses current step
  success: stepSuccess,
  error: stepIdentifier,   // error uses current step
};

// --- Navigation ---

function navigateToStep(next: LoginState): void {
  const currentEl = stepMap[state.currentStep];
  const nextEl = stepMap[next];

  if (currentEl === nextEl && next !== 'identifier') return;

  // Exit current
  currentEl.classList.remove('step--active');
  currentEl.classList.add('step--exit');

  // After transition, hide fully
  setTimeout(() => {
    currentEl.classList.remove('step--exit');
  }, 320);

  // Enter next
  nextEl.classList.add('step--active');

  state.previousStep = state.currentStep;
  state.currentStep = next;
}

function goBack(target: LoginState): void {
  const currentEl = stepMap[state.currentStep];
  const targetEl = stepMap[target];

  // Reverse transition direction
  currentEl.classList.remove('step--active');

  targetEl.classList.remove('step--exit');
  targetEl.classList.add('step--active');

  state.currentStep = target;
}

// --- Validation ---

function validateIdentifier(): string | null {
  const value = state.identifier.trim();
  if (!value) return 'Ingresa tu usuario, correo o teléfono';
  if (value.length < 2) return 'El identificador es demasiado corto';
  return null;
}

function findUser(identifier: string): DemoUser | null {
  const normalized = identifier.trim().toLowerCase();
  return DEMO_USERS.find(u => u.identifier.toLowerCase() === normalized) ?? null;
}

function validatePIN(digits: string, user: DemoUser): boolean {
  return digits === user.pin;
}

// --- Error Display ---

function showError(fieldEl: HTMLElement, errorEl: HTMLElement, message: string): void {
  fieldEl.classList.add('field--error');
  fieldEl.classList.remove('field--success', 'field--focus');

  const span = errorEl.querySelector('span');
  if (span) span.textContent = message;
  errorEl.classList.add('field__error--visible');
}

function clearError(fieldEl: HTMLElement, errorEl: HTMLElement): void {
  fieldEl.classList.remove('field--error');
  errorEl.classList.remove('field__error--visible');
}

// --- Loading & Success States ---

function setLoadingState(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.classList.add('btn--loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn--loading');
    btn.disabled = false;
  }
}

function setSuccessState(btn: HTMLButtonElement): void {
  btn.classList.remove('btn--loading', 'btn--error');
  btn.classList.add('btn--success');
  btn.disabled = true;
}

function setErrorButtonState(btn: HTMLButtonElement): void {
  btn.classList.remove('btn--loading', 'btn--success');
  btn.classList.add('btn--error');

  setTimeout(() => {
    btn.classList.remove('btn--error');
  }, 1200);
}

// --- Auth Methods Screen ---

function showAuthenticationMethods(user: DemoUser): void {
  userAvatar.textContent = user.initial;
  userName.textContent = user.name;
  navigateToStep('methods');
}

// --- PIN Screen ---

function showPINScreen(): void {
  state.pinDigits = '';
  updatePINDots();
  hidePINError();
  navigateToStep('pin');
}

function updatePINDots(): void {
  const dots = pinDots.querySelectorAll<HTMLElement>('.pin-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('pin-dot--filled', 'pin-dot--error', 'pin-dot--success');
    if (i < state.pinDigits.length) {
      dot.classList.add('pin-dot--filled');
    }
  });
}

function addPINDigit(digit: string): void {
  if (state.pinDigits.length >= PIN_LENGTH) return;

  state.pinDigits += digit;
  updatePINDots();
  hidePINError();

  if (state.pinDigits.length === PIN_LENGTH) {
    handlePINComplete();
  }
}

function removePINDigit(): void {
  if (state.pinDigits.length === 0) return;
  state.pinDigits = state.pinDigits.slice(0, -1);
  updatePINDots();
  hidePINError();
}

function showPINError(): void {
  const dots = pinDots.querySelectorAll<HTMLElement>('.pin-dot');
  dots.forEach(dot => {
    dot.classList.remove('pin-dot--filled');
    dot.classList.add('pin-dot--error');
  });
  pinError.classList.add('pin-error--visible');
}

function hidePINError(): void {
  pinError.classList.remove('pin-error--visible');
}

function setPINSuccess(): void {
  const dots = pinDots.querySelectorAll<HTMLElement>('.pin-dot');
  dots.forEach(dot => {
    dot.classList.remove('pin-dot--filled', 'pin-dot--error');
    dot.classList.add('pin-dot--success');
  });
}

async function handlePINComplete(): Promise<void> {
  if (!state.currentUser) return;

  const correct = validatePIN(state.pinDigits, state.currentUser);

  if (!correct) {
    await delay(300);
    showPINError();

    await delay(900);
    state.pinDigits = '';
    updatePINDots();
    hidePINError();
    return;
  }

  // PIN correct
  setPINSuccess();
  await delay(500);
  navigateToStep('success');
}

// --- Biometric Screen ---

function showBiometricScreen(): void {
  const verifyEl = bioIconWrap.closest('.bio-verify') as HTMLElement;
  verifyEl.classList.remove('bio-verify--scanning', 'bio-verify--success');
  bioStatus.textContent = 'Usa Face ID o tu huella digital';
  navigateToStep('biometric');

  // Start simulated scan after short delay
  setTimeout(() => {
    simulateBiometric();
  }, 800);
}

async function simulateBiometric(): Promise<void> {
  const verifyEl = bioIconWrap.closest('.bio-verify') as HTMLElement;

  // Scanning state
  verifyEl.classList.add('bio-verify--scanning');
  bioStatus.textContent = 'Verificando…';

  await delay(2000);

  // Success
  verifyEl.classList.remove('bio-verify--scanning');
  verifyEl.classList.add('bio-verify--success');
  bioStatus.textContent = 'Identidad confirmada';

  await delay(700);
  navigateToStep('success');
}

// --- Identifier Flow ---

async function handleIdentifierSubmit(): Promise<void> {
  state.identifierTouched = true;

  const error = validateIdentifier();
  if (error) {
    showError(identifierField, identifierError, error);
    setErrorButtonState(btnContinue);
    return;
  }

  clearError(identifierField, identifierError);
  setLoadingState(btnContinue, true);

  // Simulate API call
  await delay(1000);

  const user = findUser(state.identifier);

  if (!user) {
    setLoadingState(btnContinue, false);
    showError(identifierField, identifierError, 'No encontramos esta cuenta');
    setErrorButtonState(btnContinue);
    return;
  }

  state.currentUser = user;
  setLoadingState(btnContinue, false);
  showAuthenticationMethods(user);
}

// --- Reset ---

function resetAuthentication(): void {
  state.currentStep = 'identifier';
  state.previousStep = null;
  state.identifier = '';
  state.identifierTouched = false;
  state.pinDigits = '';
  state.currentUser = null;

  // Reset all step classes
  [stepIdentifier, stepMethods, stepPIN, stepBiometric, stepSuccess].forEach(el => {
    el.classList.remove('step--active', 'step--exit');
  });

  stepIdentifier.classList.add('step--active');

  // Reset form
  identifierInput.value = '';
  clearError(identifierField, identifierError);
  btnContinue.classList.remove('btn--loading', 'btn--success', 'btn--error');
  btnContinue.disabled = false;
}

// --- Utility ---

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Event Handlers ---

function initEvents(): void {
  // Identifier input
  identifierInput.addEventListener('input', () => {
    state.identifier = identifierInput.value;
    if (state.identifierTouched) {
      const error = validateIdentifier();
      if (error) {
        showError(identifierField, identifierError, error);
      } else {
        clearError(identifierField, identifierError);
        identifierField.classList.add('field--success');
      }
    }
  });

  identifierInput.addEventListener('focus', () => {
    identifierField.classList.add('field--focus');
  });

  identifierInput.addEventListener('blur', () => {
    identifierField.classList.remove('field--focus');
    if (!state.identifierTouched && state.identifier.trim()) {
      state.identifierTouched = true;
      const error = validateIdentifier();
      if (error) {
        showError(identifierField, identifierError, error);
      }
    }
  });

  // Identifier form submit
  identifierForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    if (btnContinue.classList.contains('btn--loading')) return;
    handleIdentifierSubmit();
  });

  // Biometric shortcut (from step 1)
  btnBioShortcut.addEventListener('click', () => {
    // Quick biometric: identify then authenticate
    state.identifierTouched = true;
    const error = validateIdentifier();
    if (error) {
      showError(identifierField, identifierError, error);
      return;
    }

    const user = findUser(state.identifier);
    if (!user) {
      showError(identifierField, identifierError, 'Ingresa tu identificador primero');
      return;
    }

    state.currentUser = user;
    showBiometricScreen();
  });

  // Back buttons
  btnBackMethods.addEventListener('click', () => {
    goBack('identifier');
  });

  btnBackPIN.addEventListener('click', () => {
    state.pinDigits = '';
    goBack('methods');
  });

  btnBackBio.addEventListener('click', () => {
    goBack('methods');
  });

  // Auth method selection
  btnMethodBio.addEventListener('click', () => {
    showBiometricScreen();
  });

  btnMethodPIN.addEventListener('click', () => {
    showPINScreen();
  });

  btnMethodOther.addEventListener('click', () => {
    // For prototype: show a subtle indication
    btnMethodOther.style.opacity = '0.5';
    setTimeout(() => {
      btnMethodOther.style.opacity = '';
    }, 400);
  });

  // Bio fallback to PIN
  btnBioFallback.addEventListener('click', () => {
    goBack('methods');
    setTimeout(() => {
      showPINScreen();
    }, 350);
  });

  // Numpad keys
  const numpadKeys = document.querySelectorAll<HTMLButtonElement>('.numpad__key[data-key]');
  numpadKeys.forEach(key => {
    key.addEventListener('click', () => {
      const digit = key.getAttribute('data-key');
      if (digit !== null) {
        addPINDigit(digit);
      }
    });
  });

  // PIN delete
  btnPinDelete.addEventListener('click', () => {
    removePINDigit();
  });

  // Keyboard support for PIN
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (state.currentStep !== 'pin') return;

    if (/^[0-9]$/.test(e.key)) {
      addPINDigit(e.key);
    } else if (e.key === 'Backspace') {
      removePINDigit();
    }
  });

  // Signup button (prototype only)
  const btnSignup = document.querySelector('#btnSignup');
  if (btnSignup) {
    btnSignup.addEventListener('click', () => {
      (btnSignup as HTMLElement).style.opacity = '0.5';
      setTimeout(() => {
        (btnSignup as HTMLElement).style.opacity = '';
      }, 400);
    });
  }
}

// --- Initialize ---

document.addEventListener('DOMContentLoaded', initEvents);
