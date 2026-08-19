// ==============================================
// PaySat Login — Full Screen Immersive Logic
// Purely interactive demo without automatic timeouts
// ==============================================

// --- Types ---

type LoginState = 'selection' | 'biometric' | 'pin' | 'password' | 'success';

interface AppState {
  currentStep: LoginState;
  pinDigits: string;
}

const PIN_LENGTH = 6;

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
const btnSimulateBio = qs<HTMLButtonElement>('#btnSimulateBio');

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
const passwordGlobalError = qs<HTMLElement>('#passwordGlobalError');
const passwordGlobalErrorText = qs<HTMLElement>('#passwordGlobalErrorText');
const btnSubmitPassword = qs<HTMLButtonElement>('#btnSubmitPassword');

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
    
    // Quick timeout to allow the exit animation to process
    setTimeout(() => {
      currentEl.classList.remove('step--exit');
    }, 500);

    nextEl.classList.add('step--active');
  }

  state.currentStep = next;

  // Lifecycle hooks
  if (next === 'biometric') resetBiometric();
  if (next === 'pin') resetPIN();
  if (next === 'password') resetPasswordForm();
}

// --- Biometric Logic (Manual Simulation) ---

function resetBiometric() {
  bioIconWrap.parentElement?.classList.remove('bio-verify--scanning', 'bio-verify--success');
  bioStatus.textContent = 'Asegúrate de estar en un lugar iluminado';
  btnSimulateBio.style.display = 'block';
  btnSimulateBio.textContent = 'Presionar para registrar';
}

function handleBiometricSimulation() {
  bioIconWrap.parentElement?.classList.add('bio-verify--scanning');
  bioStatus.textContent = 'Verificando identidad...';
  btnSimulateBio.style.display = 'none';

  // Solo hace la animación visual pero no hace nada más
  setTimeout(() => {
    bioIconWrap.parentElement?.classList.remove('bio-verify--scanning');
    bioStatus.textContent = 'Registro simulado (Visual)';
    // No redirige a ninguna parte como se solicitó
  }, 2000);
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

function resetPIN() {
  state.pinDigits = '';
  updatePinUI();
}

function handlePinDigit(digit: string) {
  if (state.pinDigits.length >= PIN_LENGTH) return;

  state.pinDigits += digit;
  updatePinUI();

  if (state.pinDigits.length === PIN_LENGTH) {
    // Automatically accept any 6 digits to keep the flow uninterrupted
    setTimeout(() => {
      navigateToStep('success');
    }, 300);
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
  btnSubmitPassword.querySelector('.btn__text')!.textContent = 'Ingresar de forma segura';
}

function handlePasswordSubmit(e: Event) {
  e.preventDefault();

  const user = usernameInput.value.trim();
  const pass = passwordInput.value;

  usernameField.classList.remove('field--error');
  passwordField.classList.remove('field--error');
  passwordGlobalError.classList.remove('field__error--visible');

  // Interactive validation
  if (!user || !pass) {
    if (!user) usernameField.classList.add('field--error');
    if (!pass) passwordField.classList.add('field--error');
    passwordGlobalErrorText.textContent = 'Por favor, completa ambos campos.';
    passwordGlobalError.classList.add('field__error--visible');
    return;
  }

  // Simulate success
  btnSubmitPassword.querySelector('.btn__text')!.textContent = 'Verificando...';
  
  setTimeout(() => {
    navigateToStep('success');
  }, 800);
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  
  // Method Selection
  btnGoBio.addEventListener('click', () => navigateToStep('biometric'));
  btnGoPIN.addEventListener('click', () => navigateToStep('pin'));
  btnGoPassword.addEventListener('click', () => navigateToStep('password'));

  // Global Back Navigation
  btnBackFromBio.addEventListener('click', () => navigateToStep('selection', true));
  btnBackFromPIN.addEventListener('click', () => navigateToStep('selection', true));
  btnBackFromPassword.addEventListener('click', () => navigateToStep('selection', true));

  // Biometric interaction
  btnSimulateBio.addEventListener('click', handleBiometricSimulation);

  // PIN interaction
  document.querySelectorAll('.numpad__key[data-key]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLButtonElement;
      handlePinDigit(el.getAttribute('data-key') || '');
    });
  });
  btnPinDelete.addEventListener('click', handleDeletePin);

  // Password interaction
  passwordForm.addEventListener('submit', handlePasswordSubmit);
});
