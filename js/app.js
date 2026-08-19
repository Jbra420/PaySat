"use strict";
// ============================================
// PaySat Login — Application Logic (TypeScript)
// ============================================
// --- DOM References ---
const $ = (selector) => document.querySelector(selector);
const loginForm = $('#loginForm');
const emailInput = $('#emailInput');
const passwordInput = $('#passwordInput');
const passwordToggle = $('#passwordToggle');
const rememberCheckbox = $('#rememberCheckbox');
const forgotLink = $('#forgotLink');
const submitBtn = $('#submitBtn');
const emailError = $('#emailError');
const passwordError = $('#passwordError');
const successOverlay = $('#successOverlay');
const modalBackdrop = $('#modalBackdrop');
const toastContainer = $('#toastContainer');
// --- State ---
const state = {
    email: '',
    password: '',
    rememberMe: false,
    emailTouched: false,
    passwordTouched: false,
};
let buttonState = 'idle';
// --- Validation ---
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email.trim());
}
function validateEmail() {
    const value = state.email.trim();
    if (!value)
        return 'Ingresa tu correo electrónico';
    if (!isValidEmail(value))
        return 'Ingresa un correo electrónico válido';
    return null;
}
function validatePassword() {
    const value = state.password;
    if (!value)
        return 'Ingresa tu contraseña';
    if (value.length < 6)
        return 'La contraseña debe tener al menos 6 caracteres';
    return null;
}
// --- UI Updates ---
function setFieldState(group, errorEl, state, message) {
    group.classList.remove('error', 'valid', 'focused');
    if (state === 'error') {
        group.classList.add('error');
        const msgSpan = errorEl.querySelector('span');
        if (msgSpan)
            msgSpan.textContent = message || '';
        errorEl.classList.add('visible');
        errorEl.setAttribute('role', 'alert');
    }
    else if (state === 'valid') {
        group.classList.add('valid');
        errorEl.classList.remove('visible');
        errorEl.removeAttribute('role');
    }
    else {
        errorEl.classList.remove('visible');
        errorEl.removeAttribute('role');
    }
}
function updateEmailField() {
    const group = emailInput.closest('.form-group');
    if (!state.emailTouched)
        return;
    const error = validateEmail();
    if (error) {
        setFieldState(group, emailError, 'error', error);
    }
    else {
        setFieldState(group, emailError, 'valid');
    }
}
function updatePasswordField() {
    const group = passwordInput.closest('.form-group');
    if (!state.passwordTouched)
        return;
    const error = validatePassword();
    if (error) {
        setFieldState(group, passwordError, 'error', error);
    }
    else {
        setFieldState(group, passwordError, 'valid');
    }
}
// --- Password Toggle ---
function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    const showIcon = passwordToggle.querySelector('.icon-eye');
    const hideIcon = passwordToggle.querySelector('.icon-eye-off');
    if (showIcon && hideIcon) {
        showIcon.style.display = isPassword ? 'none' : 'block';
        hideIcon.style.display = isPassword ? 'block' : 'none';
    }
    passwordToggle.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
}
// --- Button States ---
function setButtonState(newState) {
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
function showToast(message, type = 'info') {
    const existing = toastContainer.querySelector('.toast');
    if (existing)
        existing.remove();
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
function getToastIcon(type) {
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
function showSuccessOverlay() {
    successOverlay.classList.add('visible');
}
function hideSuccessOverlay() {
    successOverlay.classList.remove('visible');
}
// --- Forgot Password Modal ---
function openForgotModal() {
    modalBackdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
    const modalEmailInput = $('#modalEmailInput');
    if (modalEmailInput && state.email) {
        modalEmailInput.value = state.email;
    }
}
function closeForgotModal() {
    modalBackdrop.classList.remove('visible');
    document.body.style.overflow = '';
}
function handleForgotSubmit() {
    const modalEmailInput = $('#modalEmailInput');
    if (!modalEmailInput)
        return;
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
async function handleLogin() {
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
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// --- Event Handlers ---
function initEvents() {
    // Email input
    emailInput.addEventListener('input', () => {
        state.email = emailInput.value;
        if (state.emailTouched)
            updateEmailField();
    });
    emailInput.addEventListener('blur', () => {
        state.emailTouched = true;
        updateEmailField();
    });
    emailInput.addEventListener('focus', () => {
        const group = emailInput.closest('.form-group');
        group.classList.add('focused');
    });
    // Password input
    passwordInput.addEventListener('input', () => {
        state.password = passwordInput.value;
        if (state.passwordTouched)
            updatePasswordField();
    });
    passwordInput.addEventListener('blur', () => {
        state.passwordTouched = true;
        updatePasswordField();
    });
    passwordInput.addEventListener('focus', () => {
        const group = passwordInput.closest('.form-group');
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
        if (e.target === modalBackdrop)
            closeForgotModal();
    });
    // Modal close button
    const modalCloseBtn = $('#modalCloseBtn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeForgotModal);
    }
    // Modal send button
    const modalSendBtn = $('#modalSendBtn');
    if (modalSendBtn) {
        modalSendBtn.addEventListener('click', handleForgotSubmit);
    }
    // Form submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (buttonState !== 'idle')
            return;
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
