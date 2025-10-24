import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Backdrop */}
      <View className="flex-1 justify-center items-center bg-black/40">
        {/* Modal Content */}
        <View className="w-9/10 bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg">
          {title ? (
            <Text className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              {title}
            </Text>
          ) : null}

          {message ? (
            <Text className="text-sm text-gray-700 dark:text-gray-400 mb-4">
              {message}
            </Text>
          ) : null}

          {/* Button Container */}
          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={onCancel}
              className="py-2 px-3 rounded-lg active:opacity-70"
            >
              <Text className="text-gray-700 dark:text-gray-400">
                {cancelLabel}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={onConfirm}
              className="py-2 px-3 bg-red-600 rounded-lg active:opacity-70"
            >
              <Text className="text-white font-medium">{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}