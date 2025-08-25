// src/components/UserProfileNavigation.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserHoverCard from './UserHoverCard';
import UserProfile from './UserProfile';
import axios from '../config/axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ identifier: 'testuser' })
}));

// Mock AuthContext
const mockAuthContext = {
  user: { id: 1, username: 'currentuser' },
  token: 'mock-token',
  isAuthenticated: true,
  loading: false
};

// Test wrapper component
const TestWrapper = ({ children, authContext = mockAuthContext }) => (
  <BrowserRouter>
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('User Profile Navigation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('UserHoverCard Navigation', () => {
    const mockUser = {
      id: 2,
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      is_following: false
    };

    test('should render "View full profile" button in hover card', async () => {
      // Mock API response for user details
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser
      });

      render(
        <TestWrapper>
          <UserHoverCard user={mockUser} showOnClick={true}>
            <span>Test Child</span>
          </UserHoverCard>
        </TestWrapper>
      );

      // Click to show the hover card
      fireEvent.click(screen.getByText('Test Child'));

      // Wait for the profile button to appear
      await waitFor(() => {
        expect(screen.getByText('View full profile')).toBeInTheDocument();
      });
    });

    test('should navigate to user profile when "View full profile" is clicked', async () => {
      // Mock API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser
      });

      render(
        <TestWrapper>
          <UserHoverCard user={mockUser} showOnClick={true}>
            <span>Test Child</span>
          </UserHoverCard>
        </TestWrapper>
      );

      // Click to show hover card
      fireEvent.click(screen.getByText('Test Child'));

      // Wait for and click the profile button
      await waitFor(() => {
        const profileButton = screen.getByText('View full profile');
        fireEvent.click(profileButton);
      });

      // Verify navigation was called with correct route
      expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
    });

    test('should handle navigation with user ID when username is not available', async () => {
      const userWithoutUsername = {
        id: 2,
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        is_following: false
        // No username provided
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: userWithoutUsername
      });

      render(
        <TestWrapper>
          <UserHoverCard user={userWithoutUsername} showOnClick={true}>
            <span>Test Child</span>
          </UserHoverCard>
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Test Child'));

      await waitFor(() => {
        const profileButton = screen.getByText('View full profile');
        fireEvent.click(profileButton);
      });

      // Should navigate using user ID when username is not available
      expect(mockNavigate).toHaveBeenCalledWith('/profile/2');
    });
  });

  describe('UserProfile Component Error Handling', () => {
    test('should display error message for non-existent user', async () => {
      // Mock 404 response
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404 }
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
        expect(screen.getByText("The user you're looking for doesn't exist or has been removed.")).toBeInTheDocument();
      });
    });

    test('should display generic error message for server errors', async () => {
      // Mock server error
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500 }
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
        expect(screen.getByText("We're having trouble loading this profile. Please try again.")).toBeInTheDocument();
      });
    });

    test('should provide retry and homepage navigation options on error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404 }
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
        expect(screen.getByText('Go to Homepage')).toBeInTheDocument();
      });

      // Test homepage navigation
      fireEvent.click(screen.getByText('Go to Homepage'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('UserProfile Identifier Handling', () => {
    test('should handle numeric identifier (user ID)', async () => {
      // Mock useParams to return numeric identifier
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useParams: () => ({ identifier: '123' }),
        useNavigate: () => mockNavigate
      }));

      // Mock API response for user ID lookup
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 123,
          username: 'testuser',
          display_name: 'Test User',
          date_joined: '2023-01-01',
          is_following: false
        }
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'http://localhost:8000/auth/123/',
          { headers: { Authorization: 'Token mock-token' } }
        );
      });
    });

    test('should handle username identifier', async () => {
      // Mock useParams to return username
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useParams: () => ({ identifier: 'testuser' }),
        useNavigate: () => mockNavigate
      }));

      // Mock search API response
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            results: [{ id: 123, username: 'testuser' }]
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 123,
            username: 'testuser',
            display_name: 'Test User',
            date_joined: '2023-01-01',
            is_following: false
          }
        });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should first search for the user
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'http://localhost:8000/auth/search/',
          {
            params: { q: 'testuser' },
            headers: { Authorization: 'Token mock-token' }
          }
        );
        
        // Then fetch full user details
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'http://localhost:8000/auth/123/',
          { headers: { Authorization: 'Token mock-token' } }
        );
      });
    });

    test('should handle own profile correctly', async () => {
      // Mock viewing own profile
      const ownProfileContext = {
        ...mockAuthContext,
        user: { id: 1, username: 'testuser' }
      };

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useParams: () => ({ identifier: 'testuser' }),
        useNavigate: () => mockNavigate
      }));

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 1,
          username: 'testuser',
          display_name: 'Current User',
          date_joined: '2023-01-01'
        }
      });

      render(
        <TestWrapper authContext={ownProfileContext}>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should use profile endpoint for own profile
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'http://localhost:8000/auth/profile/',
          { headers: { Authorization: 'Token mock-token' } }
        );
      });
    });
  });

  describe('Integration Test: Complete Navigation Flow', () => {
    test('should complete full navigation flow from hover card to profile', async () => {
      const mockUser = {
        id: 2,
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        is_following: false
      };

      // Mock hover card API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser
      });

      // Render hover card
      render(
        <TestWrapper>
          <UserHoverCard user={mockUser} showOnClick={true}>
            <span>@testuser</span>
          </UserHoverCard>
        </TestWrapper>
      );

      // Step 1: Click to show hover card
      fireEvent.click(screen.getByText('@testuser'));

      // Step 2: Wait for hover card to load and click profile button
      await waitFor(() => {
        const profileButton = screen.getByText('View full profile');
        fireEvent.click(profileButton);
      });

      // Step 3: Verify navigation was called
      expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');

      // Step 4: Simulate UserProfile component loading after navigation
      // (In a real test, this would involve routing integration)
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            results: [{ id: 2, username: 'testuser' }]
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 2,
            username: 'testuser',
            display_name: 'Test User',
            date_joined: '2023-01-01',
            is_following: false,
            bio: 'Test bio',
            location: 'Test City'
          }
        });

      // Clear previous component and render UserProfile
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      // Verify UserProfile loads correctly
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });

    test('should handle missing user data gracefully', async () => {
      // Mock search that returns no results
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [] }
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    test('should prevent navigation for current user in hover card', () => {
      const currentUserMock = {
        id: 1,
        username: 'currentuser',
        display_name: 'Current User'
      };

      render(
        <TestWrapper>
          <UserHoverCard user={currentUserMock}>
            <span>Current User</span>
          </UserHoverCard>
        </TestWrapper>
      );

      // Should only show the child element, no hover card for current user
      expect(screen.getByText('Current User')).toBeInTheDocument();
      expect(screen.queryByText('View full profile')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State Handling', () => {
    test('should handle unauthenticated user gracefully', () => {
      const unauthenticatedContext = {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };

      const mockUser = {
        id: 2,
        username: 'testuser',
        display_name: 'Test User'
      };

      render(
        <TestWrapper authContext={unauthenticatedContext}>
          <UserHoverCard user={mockUser}>
            <span>Test User</span>
          </UserHoverCard>
        </TestWrapper>
      );

      // Should not show hover card for unauthenticated users
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.queryByText('View full profile')).not.toBeInTheDocument();
    });
  });
});