// components/CableColorPicker.tsx
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSiteMapStore } from './state/useSiteMapStore';

// Same 40-color palette
const COLOR_PALETTE = [
  // Blues (6)
  '#0066FF', '#00BFFF', '#4169E1', '#000080', '#1E90FF', '#6495ED',
  // Purples/Violets (6)
  '#800080', '#6A0DAD', '#8B00FF', '#9370DB', '#4B0082', '#BA55D3',
  // Pinks/Magentas (5)
  '#FF00FF', '#FF1493', '#FF69B4', '#FFC0CB', '#DB7093',
  // Oranges/Corals (5)
  '#FF8800', '#FF6600', '#FF7F50', '#FFA500', '#FF4500',
  // Yellows/Golds (3)
  '#FFD700', '#FFFF00', '#F0E68C',
  // Cyans/Teals (5)
  '#00FFFF', '#00CED1', '#40E0D0', '#008080', '#20B2AA',
  // Neutrals (6)
  '#000000', '#333333', '#808080', '#A9A9A9', '#D3D3D3', '#FFFFFF',
  // Browns/Earth Tones (4)
  '#8B4513', '#A0522D', '#D2691E', '#CD853F',
];

export default function CableColorPicker() {
  const [modalVisible, setModalVisible] = useState(false);
  const mode = useSiteMapStore((s) => s.mode);
  const cables = useSiteMapStore((s) => s.cables);
  const setPreferredCableColor = (useSiteMapStore.getState() as any).setPreferredCableColor;

  // Get the current cable color (last cable being drawn)
  const currentCable = cables.length > 0 ? cables[cables.length - 1] : null;
  const currentColor = currentCable?.color || COLOR_PALETTE[0];

  // Only show when in cable drawing mode
  if (mode !== 'draw-cable') return null;

  const handleColorSelect = (color: string) => {
    if (setPreferredCableColor) {
      setPreferredCableColor(color);
    }
    setModalVisible(false);
  };

  return (
    <>
      {/* Floating Color Button */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 120,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 12,
          padding: 12,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Color Preview Circle */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: currentColor,
            borderWidth: 3,
            borderColor: '#fff',
            marginBottom: 6,
          }}
        />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Color</Text>
      </Pressable>

      {/* Color Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#1F1F1F',
              borderRadius: 16,
              padding: 20,
              width: '85%',
              maxWidth: 400,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                Select Cable Color
              </Text>
              <Text style={{ color: '#888', fontSize: 13 }}>
                Choose a color for your next cable
              </Text>
            </View>

            {/* Color Grid */}
            <ScrollView style={{ maxHeight: 400 }}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 10,
                  justifyContent: 'center',
                }}
              >
                {COLOR_PALETTE.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => handleColorSelect(color)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: color,
                      borderWidth: currentColor === color ? 4 : 2,
                      borderColor: currentColor === color ? '#fff' : '#333',
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Close Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 16,
                backgroundColor: '#6D28D9',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}