import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

export function ScanButton() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/scanner'); 
  };

  return (
    <Pressable onPress={handlePress}  className='absolute bottom-0 flex items-center justify-center bg-green-400 dark:bg-green-500 rounded-full w-20 h-20 shadow-lg'>
      <ScanLine  color={'black'} strokeWidth={1.25} />
      <Text className={'text-black text-s mt-0.2'}>Scan</Text>
    </Pressable> 
  );
} 



export default ScanButton;