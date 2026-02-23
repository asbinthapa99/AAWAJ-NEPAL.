import { PostCategory } from './types';

export interface CategoryInfo {
  id: PostCategory;
  label: string;
  labelNp: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const categories: CategoryInfo[] = [
  {
    id: 'politics',
    label: 'Politics',
    labelNp: 'राजनीति',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🏛️',
  },
  {
    id: 'education',
    label: 'Education',
    labelNp: 'शिक्षा',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '📚',
  },
  {
    id: 'health',
    label: 'Health',
    labelNp: 'स्वास्थ्य',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '🏥',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    labelNp: 'पूर्वाधार',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: '🏗️',
  },
  {
    id: 'environment',
    label: 'Environment',
    labelNp: 'वातावरण',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: '🌿',
  },
  {
    id: 'economy',
    label: 'Economy',
    labelNp: 'अर्थतन्त्र',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: '💰',
  },
  {
    id: 'social',
    label: 'Social Issues',
    labelNp: 'सामाजिक मुद्दा',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: '👥',
  },
  {
    id: 'corruption',
    label: 'Corruption',
    labelNp: 'भ्रष्टाचार',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: '⚠️',
  },
  {
    id: 'technology',
    label: 'Technology',
    labelNp: 'प्रविधि',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: '💻',
  },
  {
    id: 'other',
    label: 'Other',
    labelNp: 'अन्य',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: '📋',
  },
];

export const getCategoryInfo = (id: PostCategory): CategoryInfo => {
  return categories.find((c) => c.id === id) || categories[categories.length - 1];
};

export const districts = [
  'Achham', 'Arghakhanchi', 'Baglung', 'Baitadi', 'Bajhang',
  'Bajura', 'Banke', 'Bara', 'Bardiya', 'Bhaktapur',
  'Bhojpur', 'Chitwan', 'Dadeldhura', 'Dailekh', 'Dang',
  'Darchula', 'Dhading', 'Dhankuta', 'Dhanusha', 'Dolakha',
  'Dolpa', 'Doti', 'Eastern Rukum', 'Gorkha', 'Gulmi',
  'Humla', 'Ilam', 'Jajarkot', 'Jhapa', 'Jumla',
  'Kailali', 'Kalikot', 'Kanchanpur', 'Kapilvastu', 'Kaski',
  'Kathmandu', 'Kavrepalanchok', 'Khotang', 'Lalitpur', 'Lamjung',
  'Mahottari', 'Makwanpur', 'Manang', 'Morang', 'Mugu',
  'Mustang', 'Myagdi', 'Nawalpur', 'Nuwakot', 'Okhaldhunga',
  'Palpa', 'Panchthar', 'Parasi (West Nawalparasi)', 'Parbat', 'Parsa',
  'Pyuthan', 'Ramechhap', 'Rasuwa', 'Rautahat', 'Rolpa',
  'Rupandehi', 'Salyan', 'Sankhuwasabha', 'Saptari', 'Sarlahi',
  'Sindhuli', 'Sindhupalchok', 'Siraha', 'Solukhumbu', 'Sunsari',
  'Surkhet', 'Syangja', 'Tanahun', 'Taplejung', 'Terhathum',
  'Udayapur', 'Western Rukum',
];
