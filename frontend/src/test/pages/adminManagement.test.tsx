// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import * as api from '../../lib/api';
import AdminManagement from '../../pages/adminManagement';

jest.mock('../../lib/api', () => ({
  changeUserRole: jest.fn(),
  createAdminAccount: jest.fn(),
}));

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AdminManagement />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('pages/adminManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all sections correctly', () => {
      renderComponent();

      expect(screen.getByRole('heading', {name: 'Admin Management'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Change User Role'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Create Admin Account'})).toBeInTheDocument();
    });
  });

  describe('Change User Role', () => {
    it('should show validation error when username is empty', async () => {
      renderComponent();

      const section = screen.getByRole('heading', {name: 'Change User Role'}).closest('section')!;
      const button = within(section).getByRole('button', {name: 'Change Role'});
      fireEvent.click(button);

      expect(await within(section).findByText('Please enter a username')).toBeInTheDocument();
      expect(api.changeUserRole).not.toHaveBeenCalled();
    });

    it('should call changeUserRole API and show success message', async () => {
      (api.changeUserRole as jest.Mock).mockResolvedValue({});

      renderComponent();

      const section = screen.getByRole('heading', {name: 'Change User Role'}).closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const roleSelect = within(section).getByLabelText('New Role');
      const button = within(section).getByRole('button', {name: 'Change Role'});

      fireEvent.change(usernameInput, {target: {value: 'testuser'}});
      fireEvent.change(roleSelect, {target: {value: 'admin'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(api.changeUserRole).toHaveBeenCalledWith('testuser', 'admin');
        expect(
          within(section).getByText('User role updated successfully to admin')
        ).toBeInTheDocument();
      });
    });

    it('should display API error message when request fails', async () => {
      (api.changeUserRole as jest.Mock).mockRejectedValue({message: 'Failed to update'});

      renderComponent();

      const section = screen.getByRole('heading', {name: 'Change User Role'}).closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const button = within(section).getByRole('button', {name: 'Change Role'});

      fireEvent.change(usernameInput, {target: {value: 'baduser'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(within(section).getByText('Failed to update')).toBeInTheDocument();
      });
    });
  });

  describe('Create Admin Account', () => {
    it('should show validation error when fields are empty', async () => {
      renderComponent();

      const section = screen
        .getByRole('heading', {name: 'Create Admin Account'})
        .closest('section')!;
      const button = within(section).getByRole('button', {name: 'Create Admin'});
      fireEvent.click(button);

      expect(await within(section).findByText('Please fill in all fields')).toBeInTheDocument();
      expect(api.createAdminAccount).not.toHaveBeenCalled();
    });

    it('should call createAdminAccount API and show success message', async () => {
      (api.createAdminAccount as jest.Mock).mockResolvedValue({});

      renderComponent();

      const section = screen
        .getByRole('heading', {name: 'Create Admin Account'})
        .closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const emailInput = within(section).getByLabelText('Email');
      const button = within(section).getByRole('button', {name: 'Create Admin'});

      fireEvent.change(usernameInput, {target: {value: 'newadmin'}});
      fireEvent.change(emailInput, {target: {value: 'newadmin@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(api.createAdminAccount).toHaveBeenCalledWith({
          username: 'newadmin',
          email: 'newadmin@example.com',
        });
        expect(
          within(section).getByText(
            'Admin account created successfully. Password reset email sent.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should display error message when create admin fails', async () => {
      (api.createAdminAccount as jest.Mock).mockRejectedValue({
        message: 'Account creation failed',
      });

      renderComponent();

      const section = screen
        .getByRole('heading', {name: 'Create Admin Account'})
        .closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const emailInput = within(section).getByLabelText('Email');
      const button = within(section).getByRole('button', {name: 'Create Admin'});

      fireEvent.change(usernameInput, {target: {value: 'baduser'}});
      fireEvent.change(emailInput, {target: {value: 'bad@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(within(section).getByText('Account creation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('should disable Change Role button when mutation is pending', async () => {
      (api.changeUserRole as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderComponent();

      const section = screen.getByRole('heading', {name: 'Change User Role'}).closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const button = within(section).getByRole('button', {name: 'Change Role'});

      fireEvent.change(usernameInput, {target: {value: 'user1'}});
      fireEvent.click(button);

      expect(within(section).getByRole('button', {name: 'Updating...'})).toBeDisabled();
    });

    it('should disable Create Admin button when mutation is pending', async () => {
      (api.createAdminAccount as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderComponent();

      const section = screen
        .getByRole('heading', {name: 'Create Admin Account'})
        .closest('section')!;
      const usernameInput = within(section).getByLabelText('Username');
      const emailInput = within(section).getByLabelText('Email');
      const button = within(section).getByRole('button', {name: 'Create Admin'});

      fireEvent.change(usernameInput, {target: {value: 'user1'}});
      fireEvent.change(emailInput, {target: {value: 'user1@example.com'}});
      fireEvent.click(button);

      expect(within(section).getByRole('button', {name: 'Creating...'})).toBeDisabled();
    });
  });
});
