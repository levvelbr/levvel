import { useState, type HTMLAttributes } from "react";
import Input from "./Input";
import Button from "./Button";

interface Props extends HTMLAttributes<HTMLDivElement> {
  onSearch?: (q: string) => void;
}

export const SearchBar = ({ onSearch, ...rest }: Props) => {
  const [search, setSearch] = useState("");

  const handleChange = (value: string) => {
    setSearch(value);
    onSearch?.(value.trim());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(search.trim());
  };

  return (
    <div className="" {...rest}>
      <form onSubmit={handleSubmit} className="flex items-center">
        <Input
          className="rounded-r-none bg-white"
          placeholder="Buscar serviços, categorias, prestadores..."
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Buscar"
        />
        <Button
          type="submit"
          className="rounded-l-none rounded-r-xl py-3 shadow-sm"
        >
          Buscar
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;
