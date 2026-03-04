import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string | null;
  sale_rate: number;
  quantity: number;
  unit: string | null;
}

interface InventoryItemSelectProps {
  inventoryItems: InventoryItem[];
  value: string | null;
  onSelect: (inventoryId: string) => void;
}

const InventoryItemSelect = ({ inventoryItems, value, onSelect }: InventoryItemSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedItem = inventoryItems.find(inv => inv.id === value);

  const filtered = inventoryItems.filter(inv =>
    inv.item_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.item_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 min-w-0 justify-between font-normal h-10"
        >
          <span className="truncate">
            {selectedItem ? selectedItem.item_name : "Select item..."}
          </span>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
          ) : (
            filtered.map((inv) => (
              <button
                key={inv.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                  value === inv.id && "bg-accent"
                )}
                onClick={() => {
                  onSelect(inv.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check className={cn("h-3 w-3 shrink-0", value === inv.id ? "opacity-100" : "opacity-0")} />
                <Package className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{inv.item_name}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {inv.quantity} {inv.unit || 'pcs'}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InventoryItemSelect;
