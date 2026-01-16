// Validação de senha
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'A senha deve ter no mínimo 6 caracteres'
    };
  }

  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um caractere especial'
    };
  }

  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um número'
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra'
    };
  }

  return {
    isValid: true,
    message: 'Senha válida'
  };
};
