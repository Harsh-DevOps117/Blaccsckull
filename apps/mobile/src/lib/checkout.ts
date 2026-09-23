import { NativeModules, TurboModuleRegistry } from 'react-native';
import { checkoutOptions, type CheckoutOrder, type CheckoutResult } from './checkout.types';

export async function openCheckout(order: CheckoutOrder): Promise<CheckoutResult> {
  if (!NativeModules.RNRazorpayCheckout && !TurboModuleRegistry.get('RNRazorpayCheckout'))
    throw new Error(
      'Razorpay needs a native development build. Use the web app or rebuild with Expo prebuild; Expo Go cannot run this checkout.',
    );
  const RazorpayCheckout = require('react-native-razorpay').default;
  try {
    return await RazorpayCheckout.open(checkoutOptions(order));
  } catch (error) {
    throw new Error(
      (error as { description?: string }).description ??
        'Payment cancelled or failed. Retry registration to check its status.',
    );
  }
}
