#!/usr/bin/env python3
"""
Script para fazer upload das alterações no GitHub
"""
import subprocess
import os
import sys

def run_command(cmd, cwd="/workspaces/ShopInitial"):
    """Executar comando no diretório especificado"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def main():
    print("=" * 70)
    print("📤 UPLOAD DE ALTERAÇÕES NO GITHUB")
    print("=" * 70)
    
    # Step 1: Git status
    print("\n[1/4] Verificando status dos arquivos...")
    code, out, err = run_command("git status")
    if code != 0:
        print(f"❌ Erro: {err}")
        return False
    print("✅ Status verificado")
    
    # Step 2: Add all files
    print("\n[2/4] Adicionando arquivos...")
    code, out, err = run_command("git add -A")
    if code != 0:
        print(f"❌ Erro: {err}")
        return False
    print("✅ Arquivos adicionados")
    
    # Show what will be committed
    code, files_out, _ = run_command("git diff --cached --name-only")
    if files_out:
        print("\n📋 Arquivos que serão commitados:")
        for line in files_out.strip().split('\n')[:15]:
            print(f"   • {line}")
        if len(files_out.strip().split('\n')) > 15:
            print(f"   ... e mais {len(files_out.strip().split('\n')) - 15} arquivos")
    
    # Step 3: Commit
    print("\n[3/4] Fazendo commit...")
    commit_msg = """feat: adicionar CPF e WhatsApp ao perfil do usuário com máscaras automáticas

- Adicionados campos cpf e whatsapp ao modelo User (schema.prisma)
- Criado utilitário de máscaras (FrontEnd/utilities/masks.ts) com 7 funções
- Atualizado endpoint PUT /auth/update para validar novos campos
- Atualizado endpoint GET /auth/me para retornar novos campos
- Atualizado endpoint POST /auth/register para aceitar novos campos
- Adicionada interface na página de perfil com máscaras automáticas
- Implementadas validações em tempo real (frontend e backend)
- Adicionada documentação completa (9 arquivos)

Máscaras implementadas:
- CPF: XXX.XXX.XXX-XX (11 dígitos)
- WhatsApp: (+55) 11 99999-9999 (11 ou 13 dígitos)"""
    
    code, out, err = run_command(f'git commit -m "{commit_msg}"')
    if code != 0 and "nothing to commit" not in err:
        print(f"❌ Erro: {err}")
        return False
    print("✅ Commit realizado")
    print(out)
    
    # Step 4: Push
    print("\n[4/4] Fazendo push para GitHub...")
    code, out, err = run_command("git push origin clothes")
    if code != 0:
        print(f"❌ Erro ao fazer push: {err}")
        return False
    print("✅ Push realizado com sucesso!")
    print(out)
    
    # Final status
    print("\n" + "=" * 70)
    print("✅ UPLOAD CONCLUÍDO COM SUCESSO!")
    print("=" * 70)
    print("\n📍 Verifique em: https://github.com/ZahraMirzaei/online-shop/commits/clothes")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
