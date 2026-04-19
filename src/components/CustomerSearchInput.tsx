import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
}

interface CustomerSearchInputProps {
  customers: Customer[];
  value: string;
  onCustomerSelect: (customer: Customer) => void;
  onValueChange: (value: string) => void;
}

export function CustomerSearchInput({
  customers,
  value,
  onCustomerSelect,
  onValueChange,
}: CustomerSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isNewCustomer =
    searchTerm.trim() &&
    !customers.some(
      (c) => c.name.toLowerCase() === searchTerm.toLowerCase()
    );

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onValueChange(newValue);
    setIsOpen(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSearchTerm(customer.name);
    onCustomerSelect(customer);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <Label htmlFor="customer_name">Customer Name *</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="customer_name"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="Search or enter customer name..."
          className="pl-10"
          required
          autoComplete="off"
        />
      </div>

      {isOpen && (filteredCustomers.length > 0 || isNewCustomer) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-[200px]">
            {filteredCustomers.length > 0 && (
              <div className="p-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Existing Customers
                </div>
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className={cn(
                      "w-full flex items-start gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors",
                      "focus:outline-none focus:bg-accent"
                    )}
                  >
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[customer.contact, customer.email].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isNewCustomer && (
              <div className="p-1 border-t">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  New Customer
                </div>
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  "{searchTerm}" will be saved as a new customer
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
