// app/index.tsx
//
// De (tabs)-group heeft geen eigen index-route, dus het kale pad "/" kwam uit
// op expo-router's "Unmatched Route". Deze redirect stuurt "/" door naar de
// eerste tab (Vandaag).

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/today" />;
}
