import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get<Food>(`/foods/${routeParams.id}`);
      const dadosFormatted = {...response.data, formattedPrice: formatValue(response.data.price)}

      setFood(dadosFormatted);
      const { extras } = dadosFormatted;
      
      const newExtra = extras.map((item) => {
        return {...item, quantity: 0}
      });

      setExtras(newExtra);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extrasIndex = extras.findIndex(item => item.id === id);
    if (extrasIndex >= 0) {

      const cloneExtras = extras;
      const filterExtra = cloneExtras.filter(item => item.id === id);
      filterExtra[0].quantity = filterExtra[0].quantity + 1;

      setExtras(
        extras.map(mapExtra => (mapExtra.id === id ? { ...filterExtra[0] }: mapExtra))
      );
    }
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extrasIndex = extras.findIndex(item => item.id === id);
    if (extrasIndex >= 0) {

      const cloneExtras = extras;
      const filterExtra = cloneExtras.filter(item => item.id === id);
      if (filterExtra[0].quantity > 0) {
        filterExtra[0].quantity = filterExtra[0].quantity - 1;
      }
      
      setExtras(
        extras.map(mapExtra => (mapExtra.id === id ? { ...filterExtra[0] }: mapExtra))
      );
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    const qtdFood = foodQuantity + 1;
    setFoodQuantity(qtdFood);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    let qtdFood = foodQuantity - 1;
    if (qtdFood < 1) {
      qtdFood = 1;
    }
    setFoodQuantity(qtdFood);
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    var arrayTotalExtras = extras.map(function(item) {
      return item.quantity * item.value;
    });

    let totalExtras;
    if (arrayTotalExtras.length === 1) {
      totalExtras = arrayTotalExtras[0];
    } else {
      totalExtras = arrayTotalExtras[0] + arrayTotalExtras[1];
    }

    const price = (food.price * foodQuantity) + totalExtras;
    return formatValue(price) ;

  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const data = {
      "product_id": food.id,
      "name": food.name,
      "description": food.description,
      "price": food.price,
      "thumbnail_url": food.image_url,
      "extras": food.extras
    };

    const response = await api.post('/orders', data);
    console.log('CASCSCS', response.data);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
