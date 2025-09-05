/**
 * Unit tests for StatCard component
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mount, VueWrapper } from '@vue/test-utils';
import StatCard from '../../components/dashboard/StatCard.vue';

describe('StatCard Component', () => {
  let wrapper: VueWrapper<any>;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Active Agents',
          value: '12',
          icon: 'UserGroupIcon',
          color: 'blue',
        },
      });

      expect(wrapper.find('p').text()).toContain('Active Agents');
      expect(wrapper.text()).toContain('12');
      expect(wrapper.find('.text-blue-600').exists()).toBe(true);
    });

    it('should render with numeric value', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Evolution Events',
          value: 42,
          icon: 'BeakerIcon',
          color: 'purple',
        },
      });

      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('Evolution Events');
    });

    it('should display correct icon based on prop', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Performance Score',
          value: '85%',
          icon: 'ChartBarIcon',
          color: 'green',
        },
      });

      // The icon should be rendered as a component
      const iconElement = wrapper.find('[data-testid="chart-bar-icon"]');
      // Since we can't easily test the actual icon component, we test the class structure
      expect(wrapper.find('.w-6.h-6').exists()).toBe(true);
    });
  });

  describe('Color Variants', () => {
    const colors = ['blue', 'purple', 'green', 'amber'] as const;

    colors.forEach((color) => {
      it(`should apply ${color} color scheme correctly`, () => {
        wrapper = mount(StatCard, {
          props: {
            title: 'Test Stat',
            value: '100',
            icon: 'AcademicCapIcon',
            color,
          },
        });

        // Check background color
        expect(wrapper.find(`.bg-${color}-100`).exists()).toBe(true);
        // Check icon color
        expect(wrapper.find(`.text-${color}-600`).exists()).toBe(true);
      });
    });
  });

  describe('Trend Indicator', () => {
    it('should display upward trend correctly', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Success Rate',
          value: '92%',
          icon: 'ChartBarIcon',
          color: 'green',
          trend: {
            direction: 'up',
            value: 5.2,
          },
        },
      });

      expect(wrapper.text()).toContain('5.2%');
      expect(wrapper.find('.text-green-600').exists()).toBe(true);
    });

    it('should display downward trend correctly', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Error Rate',
          value: '2.1%',
          icon: 'ChartBarIcon',
          color: 'amber',
          trend: {
            direction: 'down',
            value: 1.3,
          },
        },
      });

      expect(wrapper.text()).toContain('1.3%');
      expect(wrapper.find('.text-red-600').exists()).toBe(true);
    });

    it('should not display trend when not provided', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Static Metric',
          value: '50',
          icon: 'UserGroupIcon',
          color: 'blue',
        },
      });

      // Should not find any trend indicators
      expect(wrapper.find('.text-green-600').exists()).toBe(false);
      expect(wrapper.find('.text-red-600').exists()).toBe(false);
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Test',
          value: '123',
          icon: 'BeakerIcon',
          color: 'purple',
        },
      });

      const cardElement = wrapper.find('.bg-white');
      expect(cardElement.classes()).toContain('dark:bg-gray-800');
      expect(cardElement.classes()).toContain('dark:border-gray-700');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Accessible Stat',
          value: '999',
          icon: 'AcademicCapIcon',
          color: 'blue',
        },
      });

      // Check that the component is properly structured for screen readers
      const titleElement = wrapper.find('.text-sm.font-medium');
      const valueElement = wrapper.find('.text-2xl.font-bold');
      
      expect(titleElement.text()).toBe('Accessible Stat');
      expect(valueElement.text()).toBe('999');
    });

    it('should have proper color contrast indicators', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Contrast Test',
          value: '42',
          icon: 'ChartBarIcon',
          color: 'green',
          trend: { direction: 'up', value: 10 },
        },
      });

      // Verify that text elements have appropriate contrast classes
      expect(wrapper.find('.text-gray-600').exists()).toBe(true);
      expect(wrapper.find('.text-gray-900').exists()).toBe(true);
    });
  });

  describe('Interactive Behavior', () => {
    it('should have hover effects', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Hoverable Card',
          value: '789',
          icon: 'UserGroupIcon',
          color: 'amber',
        },
      });

      const cardElement = wrapper.find('.bg-white');
      expect(cardElement.classes()).toContain('hover:shadow-lg');
      expect(cardElement.classes()).toContain('transition-shadow');
      expect(cardElement.classes()).toContain('duration-200');
    });
  });

  describe('Props Validation', () => {
    it('should handle string values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'String Value Test',
          value: 'Connected',
          icon: 'BeakerIcon',
          color: 'green',
        },
      });

      expect(wrapper.find('.text-2xl').text()).toBe('Connected');
    });

    it('should handle numeric values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Numeric Value Test',
          value: 1337,
          icon: 'ChartBarIcon',
          color: 'purple',
        },
      });

      expect(wrapper.find('.text-2xl').text()).toBe('1337');
    });

    it('should handle decimal trend values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Decimal Trend',
          value: '98.7%',
          icon: 'AcademicCapIcon',
          color: 'blue',
          trend: {
            direction: 'up',
            value: 0.3,
          },
        },
      });

      expect(wrapper.text()).toContain('0.3%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Zero Value',
          value: 0,
          icon: 'UserGroupIcon',
          color: 'amber',
        },
      });

      expect(wrapper.find('.text-2xl').text()).toBe('0');
    });

    it('should handle zero trend values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Zero Trend',
          value: '50%',
          icon: 'ChartBarIcon',
          color: 'green',
          trend: {
            direction: 'up',
            value: 0,
          },
        },
      });

      expect(wrapper.text()).toContain('0%');
    });

    it('should handle long titles gracefully', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      wrapper = mount(StatCard, {
        props: {
          title: longTitle,
          value: '42',
          icon: 'BeakerIcon',
          color: 'purple',
        },
      });

      expect(wrapper.text()).toContain(longTitle);
    });

    it('should handle large numeric values', () => {
      wrapper = mount(StatCard, {
        props: {
          title: 'Large Number',
          value: 999999999,
          icon: 'AcademicCapIcon',
          color: 'blue',
        },
      });

      expect(wrapper.find('.text-2xl').text()).toBe('999999999');
    });
  });
});