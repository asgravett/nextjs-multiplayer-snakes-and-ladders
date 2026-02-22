import { render, screen } from '@testing-library/react';
import GameHeader from '@/components/GameHeader';

// next/link uses client-side navigation; jest-environment-jsdom renders the
// anchor element, which is sufficient for these tests.
jest.mock('next/link', () => {
  const MockLink = ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('GameHeader', () => {
  describe('title', () => {
    test('should render the default title "Game Lobby" when no title is provided', () => {
      render(<GameHeader />);
      expect(screen.getByRole('heading')).toHaveTextContent('Game Lobby');
    });

    test('should render a custom title when provided', () => {
      render(<GameHeader title="My Custom Game" />);
      expect(screen.getByRole('heading')).toHaveTextContent('My Custom Game');
    });
  });

  describe('subtitle', () => {
    test('should render the subtitle when provided', () => {
      render(<GameHeader subtitle="Room: test-room" />);
      expect(screen.getByText('Room: test-room')).toBeInTheDocument();
    });

    test('should not render a subtitle element when not provided', () => {
      render(<GameHeader title="Game" />);
      // The only paragraph-level text should not exist
      expect(screen.queryByText(/room:/i)).not.toBeInTheDocument();
    });
  });

  describe('back button', () => {
    test('should render the home back button by default', () => {
      render(<GameHeader />);
      expect(screen.getByTitle('Home')).toBeInTheDocument();
    });

    test('should hide the back button when showBackButton is false', () => {
      render(<GameHeader showBackButton={false} />);
      expect(screen.queryByTitle('Home')).not.toBeInTheDocument();
    });

    test('should show the back button when showBackButton is explicitly true', () => {
      render(<GameHeader showBackButton={true} />);
      expect(screen.getByTitle('Home')).toBeInTheDocument();
    });

    test('back button should link to the home route', () => {
      render(<GameHeader />);
      expect(screen.getByTitle('Home')).toHaveAttribute('href', '/');
    });
  });

  describe('actions slot', () => {
    test('should render action elements passed via the actions prop', () => {
      render(<GameHeader actions={<button>Start Game</button>} />);
      expect(
        screen.getByRole('button', { name: /start game/i }),
      ).toBeInTheDocument();
    });

    test('should render nothing in the actions area when no actions are provided', () => {
      const { container } = render(<GameHeader />);
      // The actions div should be present but empty
      const headerButtons = container.querySelectorAll('button');
      expect(headerButtons).toHaveLength(0);
    });
  });
});
