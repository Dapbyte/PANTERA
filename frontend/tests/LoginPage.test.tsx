import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../src/pages/LoginPage';
import { authService, type User } from '../src/services';

vi.mock('../src/services', async () => {
  const actual = await vi.importActual<typeof import('../src/services')>('../src/services');
  return {
    ...actual,
    authService: {
      ...actual.authService,
      login: vi.fn(),
    },
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fills credentials from demo hint and submits email login via authService', async () => {
    const mockUser: User = {
      id_pengguna: 1,
      nama: 'Daniel Sipahutar',
      email: 'direktur@pantera.id',
      peran: 'Direktur',
      status_aktif: true,
      must_change_password: false,
      lokasi_tugas: null,
      nomor_kontak: null,
      divisi: 'Direksi',
    };

    vi.mocked(authService.login).mockResolvedValueOnce({
      token: 'fake-token',
      peran: 'Direktur',
      user: mockUser,
    });

    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    // Klik shortcut akun seeder Direktur
    fireEvent.click(screen.getByText('direktur@pantera.id'));
    expect(screen.getByLabelText('Email Perusahaan')).toHaveValue('direktur@pantera.id');

    fireEvent.click(screen.getByRole('button', { name: /Masuk ke Dashboard/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'direktur@pantera.id',
        password: 'password123',
      });
      expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows inline validation errors when submitting empty form', async () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Masuk ke Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Masukkan alamat email perusahaan yang valid.')).toBeInTheDocument();
      expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows error alert when login fails', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Kredensial login tidak valid.'));

    render(<LoginPage onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email Perusahaan'), {
      target: { value: 'salah@pantera.id' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Masuk ke Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Kredensial login tidak valid.');
    });
  });
});
