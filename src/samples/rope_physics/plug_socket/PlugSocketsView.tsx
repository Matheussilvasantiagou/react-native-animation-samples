import React, { useRef, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RopeViewSkia } from '.';
import { BackButton } from '../../../components';
import { INPUT_UNITS, OUTPUT_UNITS, UNIT_SIZE } from './model';
import { ActiveUnitInfo, UnitDataInfo, UnitInfoType } from './types';

import * as theme from '../../../theme';

const screenWidth = Dimensions.get('window').width;

interface UnitViewProps {
  unit: UnitDataInfo;
  index: number;
  activeInput?: ActiveUnitInfo | null;
  onLayout: ((event: LayoutChangeEvent) => void) | undefined;
  getRef: React.LegacyRef<View> | undefined;
}

type UnitViewRefs = {
  input: Array<View | null>;
  output: Array<View | null>;
};

// Unit view showing on left and right indicating input and output
const UnitView: React.FC<UnitViewProps> = ({
  unit,
  index,
  activeInput,
  onLayout,
  getRef,
}) => {
  // Determine whether any output unit is active or not
  const isValidSelection = activeInput && !activeInput?.isGestureActive;
  const isActive = isValidSelection && activeInput?.output === index; // will be always false for Input units

  const activeUnit = isActive ? INPUT_UNITS[activeInput.input] : unit;

  return (
    <View
      style={[
        styles.unitContainer,
        {
          backgroundColor: activeUnit.color.fill,
          borderColor: activeUnit.color.stroke,
          marginBottom: index < INPUT_UNITS.length - 1 ? 12 : 0,
          width: (screenWidth - 16 * 4) / 4,
        },
      ]}
      onLayout={onLayout}
      ref={getRef}
    />
  );
};

const PlugSocketsView = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const inset = useSafeAreaInsets();

  // to switch between Skia <---> SVG solution
  const [solutionSvg, SwitchSolution] = useState(false);

  // Current active input that we use to Activate the output unit with same theme
  const [activeUnit, setActiveUnit] = useState<ActiveUnitInfo>({
    input: 0,
    output: 0,
    isGestureActive: false,
  });

  // This stores the unit's coordinates (helpful to calculate plug position)
  const [unitsInfo, setUnitsInfo] = useState<UnitInfoType>({
    inputUnits: Array(INPUT_UNITS.length),
    outputUnits: Array(OUTPUT_UNITS.length),
  });

  // Here we store all the Unit's reference to get their actual position on the screen using 'measure' func, in 'onLayout'.
  const viewRefs = useRef<UnitViewRefs>({
    input: Array(INPUT_UNITS.length),
    output: Array(OUTPUT_UNITS.length),
  });

  return (
    <View
      style={[
        themeStyles(isDarkMode).container,
        { paddingTop: inset.top + 16 + 42 + 8 }, // 42 + 8 = back button height + paddingTop
      ]}
    >
      <StatusBar
        barStyle={`${isDarkMode ? 'light' : 'dark'}-content`}
        backgroundColor={theme.rope(isDarkMode).bg}
      />

      {/* Input and Output units */}
      <View style={{ justifyContent: 'space-between', gap: 100 }}>
        <View style={themeStyles(isDarkMode).compartimentContainer}>
          {INPUT_UNITS.map((unit, index) => (
            <UnitView
              key={`${unit.icon}_${index}`}
              {...{ unit, index }}
              onLayout={_e => {
                // 'measureInWindow' was for some reason, initially returning 0, so instead using 'measure'
                viewRefs.current.input[index]?.measure(
                  (_x, _y, _w, _h, pageX, pageY) =>
                    setUnitsInfo(units => {
                      const inputUnits = [...units.inputUnits];
                      inputUnits[index] = {
                        startX: pageX,
                        endX: pageX + UNIT_SIZE,
                        startY: pageY,
                        endY: pageY + UNIT_SIZE,
                      };
                      return { ...units, inputUnits };
                    }),
                );
              }}
              getRef={ref => (viewRefs.current.input[index] = ref)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {OUTPUT_UNITS.map((unit, index) => (
            <UnitView
              key={`${unit.icon}_${index}`}
              {...{ unit, index }}
              activeInput={activeUnit}
              onLayout={_e => {
                viewRefs.current.output[index]?.measure(
                  (_x, _y, _w, _h, pageX, pageY) =>
                    setUnitsInfo(units => {
                      const outputUnits = [...units.outputUnits];
                      outputUnits[index] = {
                        startX: pageX,
                        endX: pageX + UNIT_SIZE,
                        startY: pageY,
                        endY: pageY + UNIT_SIZE,
                      };
                      return { ...units, outputUnits };
                    }),
                );
              }}
              getRef={ref => (viewRefs.current.output[index] = ref)}
            />
          ))}
        </View>
      </View>

      {/* Linha */}
      <View style={{ ...StyleSheet.absoluteFillObject }}>
        {unitsInfo.inputUnits?.[0] && unitsInfo.outputUnits?.[0] && (
          <RopeViewSkia
            {...{ unitsInfo, activeUnit }}
            onPlugged={setActiveUnit}
          />
        )}
      </View>

      {/* Header Switch */}
      <View style={[styles.headerContainer, { top: inset.top + 8 }]}>
        <BackButton style={{ marginTop: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={[
              themeStyles(isDarkMode).headerText,
              solutionSvg && { color: 'grey' },
            ]}
          >
            Skia
          </Text>
          <Switch
            style={{ marginHorizontal: 8 }}
            trackColor={{ false: '#6EA7F9', true: '#pink' }}
            thumbColor="#2767FD"
            ios_backgroundColor="#6EA7F9"
            onValueChange={() => SwitchSolution(!solutionSvg)}
            value={solutionSvg}
          />
          <Text
            style={[
              themeStyles(isDarkMode).headerText,
              !solutionSvg && { color: 'grey' },
            ]}
          >
            SVG
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitContainer: {
    height: 115,
    width: '100%',
    borderWidth: 1,
    justifyContent: 'center',
  },
  unitSmallIcon: {
    position: 'absolute',
    top: 6,
    left: 6,
    shadowColor: 'black',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 8,
  },
});

const themeStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.rope(isDarkMode).bg,
    },
    headerText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.rope(isDarkMode).blackWhite,
    },
    compartimentContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      width: '100%',
      borderWidth: 1,
    },
  });

export default PlugSocketsView;
