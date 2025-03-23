import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Text as SvgText, G } from "react-native-svg";

// AQI Color Ranges with improved colors
const AQI_RANGES = [
  { min: 0, max: 50, color: "#00e400", label: "Good" },
  { min: 51, max: 100, color: "#ffff00", label: "Moderate" },
  { min: 101, max: 150, color: "#ff7e00", label: "Unhealthy for Sensitive" },
  { min: 151, max: 200, color: "#ff0000", label: "Unhealthy" },
  { min: 201, max: 300, color: "#8f3f97", label: "Very Unhealthy" },
  { min: 301, max: 500, color: "#7e0023", label: "Hazardous" },
];

const AQIMeter = ({ aqi, quality, color }: { aqi: number; quality: string; color: string }) => {
  // Constrain AQI value between 0 and 500
  const boundedAQI = Math.min(Math.max(0, aqi + 30), 500);
  
  // Calculate angle for the needle (180 degrees total sweep)
  const needleAngle = -90 + (boundedAQI / 500) * 180;
  
  // Calculate the segments for the meter
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(110, 110, 100, startAngle);
    const end = polarToCartesian(110, 110, 100, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y,
      "A", 100, 100, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <View style={{ alignItems: "center", marginVertical: 20 }}>
      <Svg width="220" height="140" viewBox="0 0 220 140">
        {/* Background Arc */}
        <Path
          d="M 10 110 A 100 100 0 0 1 210 110"
          stroke="#e0e0e0"
          strokeWidth="20"
          fill="none"
        />
        
        {/* Color Segments */}
        {AQI_RANGES.map((range, index) => {
          const startAngle = -90 + (range.min / 500) * 180;
          const endAngle = -90 + (range.max / 500) * 180;
          return (
            <Path
              key={index}
              d={createArc(startAngle, endAngle)}
              stroke={range.color}
              strokeWidth="20"
              strokeLinecap="butt"
              fill="none"
            />
          );
        })}
        
        {/* Center Point */}
        <Circle cx="110" cy="110" r="6" fill="#2f2f2f" />
        
        {/* Needle */}
        <G transform={`rotate(${needleAngle}, 110, 110)`}>
          <Path
            d="M 110 30 L 110 110"
            stroke="#2f2f2f"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="110" cy="110" r="8" fill="#2f2f2f" />
        </G>
        
        {/* AQI Value */}
        <SvgText
          x="110"
          y="75"
          fontSize="24"
          fontWeight="bold"
          fill={color}
          textAnchor="middle"
        >
          {`AQI: ${Math.round(boundedAQI)}`}
        </SvgText>
        
        {/* Quality Text */}
        <SvgText
          x="110"
          y="95"
          fontSize="16"
          fill="#2f2f2f"
          textAnchor="middle"
        >
          {quality}
        </SvgText>
      </Svg>
    </View>
  );
};

export default AQIMeter;