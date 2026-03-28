import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
].map(s => ({ value: s, label: s }));

interface AddressFormProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onChange: (field: string, value: string) => void;
}

export function AddressForm({ address, city, state, zipCode, onChange }: AddressFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Service Location</h2>
      <p className="text-sm text-gray-500">Where should our technician come to service your vehicle?</p>

      <Input
        id="address"
        label="Street Address"
        placeholder="123 Main Street"
        value={address}
        onChange={(e) => onChange('address', e.target.value)}
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="city"
          label="City"
          placeholder="Austin"
          value={city}
          onChange={(e) => onChange('city', e.target.value)}
        />
        <Select
          id="state"
          label="State"
          options={US_STATES}
          placeholder="Select state"
          value={state}
          onChange={(e) => onChange('state', e.target.value)}
        />
        <Input
          id="zip"
          label="ZIP Code"
          placeholder="78701"
          value={zipCode}
          onChange={(e) => onChange('zip_code', e.target.value)}
        />
      </div>
    </div>
  );
}
