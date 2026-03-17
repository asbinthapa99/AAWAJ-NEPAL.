import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';

export interface GlassAlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  cancelText?: string;
  actionText?: string;
  onCancel?: () => void;
  onAction?: () => void;
}

export const GlassAlertDialog: React.FC<GlassAlertDialogProps> = ({
  visible,
  onClose,
  title,
  description,
  cancelText = 'Cancel',
  actionText = 'Continue',
  onCancel,
  onAction,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* The backdrop blur */}
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

        {/* The actual dialog box */}
        <View style={styles.dialogContainer}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.dialogInner}>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
            
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  onCancel?.() || onClose();
                }}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  onAction?.();
                  onClose();
                }}
              >
                <Text style={styles.actionText}>{actionText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Simplified GlassButton for triggering actions elsewhere
export const GlassButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'outline' | 'solid';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}> = ({ title, onPress, variant = 'solid', style, textStyle }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[
      styles.glassButtonContainer,
      variant === 'outline' && styles.glassButtonOutline,
      style
    ]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <Text style={[
        styles.glassButtonText,
        variant === 'outline' && styles.glassButtonTextOutline,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // fallback base
  },
  dialogInner: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  glassButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  glassButtonOutline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  glassButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  glassButtonTextOutline: {
    color: '#333',
  },
});
