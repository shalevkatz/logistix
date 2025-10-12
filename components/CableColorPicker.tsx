// components/CableColorPicker.tsx
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSiteMapStore } from './state/useSiteMapStore';

const COLOR_PALETTE = [
  '#0066FF', '#00BFFF', '#4169E1', '#000080', '#1E90FF', '#6495ED',
  '#800080', '#6A0DAD', '#8B00FF', '#9370DB', '#4B0082', '#BA55D3',
  '#FF00FF', '#FF1493', '#FF69B4', '#FFC0CB', '#DB7093',
  '#FF8800', '#FF6600', '#FF7F50', '#FFA500', '#FF4500',
  '#FFD700', '#FFFF00', '#F0E68C',
  '#00FFFF', '#00CED1', '#40E0D0', '#008080', '#20B2AA',
  '#000000', '#333333', '#808080', '#A9A9A9', '#D3D3D3', '#FFFFFF',
  '#8B4513', '#A0522D',
];

export default function CableColorPicker({ editable = false }: { editable?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const preferredCableColor = useSiteMapStore((s) => s.preferredCableColor);
  const setPreferredCableColor = useSiteMapStore((s) => s.setPreferredCableColor);
  const cables = useSiteMapStore((s) => s.cables);

  const currentCable = cables[cables.length - 1];
  const displayColor = preferredCableColor || currentCable?.color || '#0066FF';

  // Only show in edit mode
  if (!editable) return null;

  return (
    <>
      {/* Color Button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: '#374151',
          borderRadius: 12,
          padding: 12,
          alignItems: 'center',
          minWidth: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: displayColor,
            borderWidth: 2,
            borderColor: '#fff',
            marginBottom: 4,
          }}
        />
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Color</Text>
      </Pressable>

      {/* Color Picker Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#1f2937',
              borderRadius: 16,
              padding: 20,
              width: 300,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Select Cable Color
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'center',
              }}
            >
              {COLOR_PALETTE.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => {
                    setPreferredCableColor(color);
                    setIsOpen(false);
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: color,
                    borderWidth: 4,
                    borderColor: preferredCableColor === color ? '#7c3aed' : 'transparent',
                  }}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setIsOpen(false)}
              style={{
                marginTop: 20,
                backgroundColor: '#374151',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}