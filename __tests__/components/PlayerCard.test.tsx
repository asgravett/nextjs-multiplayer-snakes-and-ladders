import { render, screen } from '@testing-library/react';
import PlayerCard from '@/components/PlayerCard';

const defaultProps = {
  name: 'Alice',
  isHost: false,
  isMe: false,
  colorIndex: 0,
};

describe('PlayerCard', () => {
  describe('player name', () => {
    test('should render the player name', () => {
      render(<PlayerCard {...defaultProps} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    test('should render a different player name', () => {
      render(<PlayerCard {...defaultProps} name="Bob" />);
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('avatar', () => {
    test('should display the first letter of the player name as the avatar', () => {
      render(<PlayerCard {...defaultProps} name="Charlie" />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    test('should display the uppercased first letter', () => {
      render(<PlayerCard {...defaultProps} name="dana" />);
      expect(screen.getByText('D')).toBeInTheDocument();
    });
  });

  describe('isMe indicator', () => {
    test('should show "(You)" label when isMe is true', () => {
      render(<PlayerCard {...defaultProps} isMe={true} />);
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    test('should not show "(You)" label when isMe is false', () => {
      render(<PlayerCard {...defaultProps} isMe={false} />);
      expect(screen.queryByText('(You)')).not.toBeInTheDocument();
    });
  });

  describe('host badge', () => {
    test('should show the Host badge when isHost is true', () => {
      render(<PlayerCard {...defaultProps} isHost={true} />);
      expect(screen.getByText(/host/i)).toBeInTheDocument();
    });

    test('should not show the Host badge when isHost is false', () => {
      render(<PlayerCard {...defaultProps} isHost={false} />);
      expect(screen.queryByText(/host/i)).not.toBeInTheDocument();
    });
  });

  describe('combined states', () => {
    test('should show both "(You)" and Host badge when the local player is also host', () => {
      render(<PlayerCard {...defaultProps} isMe={true} isHost={true} />);
      expect(screen.getByText('(You)')).toBeInTheDocument();
      expect(screen.getByText(/host/i)).toBeInTheDocument();
    });

    test('should render cleanly with all props set to false', () => {
      const { container } = render(
        <PlayerCard name="Eve" isHost={false} isMe={false} colorIndex={0} />,
      );
      expect(container).not.toBeEmptyDOMElement();
      expect(screen.getByText('Eve')).toBeInTheDocument();
    });
  });

  describe('colorIndex', () => {
    test('should render without error for all four player color indices', () => {
      [0, 1, 2, 3].forEach((idx) => {
        expect(() =>
          render(
            <PlayerCard
              name="Test"
              isHost={false}
              isMe={false}
              colorIndex={idx}
            />,
          ),
        ).not.toThrow();
      });
    });

    test('should handle out-of-bounds colorIndex gracefully via modulo', () => {
      // Index 4 wraps back to 0 (red) via the % PLAYER_COLORS.length logic
      expect(() =>
        render(
          <PlayerCard name="Test" isHost={false} isMe={false} colorIndex={4} />,
        ),
      ).not.toThrow();
    });
  });
});
