import React, { FC } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements: FC<PasswordRequirementsProps> = ({ password }) => {
  const { t } = useLanguage();
  
  const requirements = [
    {
      text: t['A senha deve ter no mínimo 6 caracteres'],
      met: password.length >= 6,
    },
    {
      text: t['A senha deve conter pelo menos um caractere especial'],
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
    {
      text: t['A senha deve conter pelo menos um número'],
      met: /\d/.test(password),
    },
    {
      text: t['A senha deve conter pelo menos uma letra'],
      met: /[a-zA-Z]/.test(password),
    },
  ];

  return (
    <div className="mt-2 text-sm">
      <p className="mb-1 text-gray-600">{t.PasswordRequirements || 'Requisitos da senha'}:</p>
      <ul className="list-none pl-2">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center ${
              req.met ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span className="mr-2">
              {req.met ? '✓' : '○'}
            </span>
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
