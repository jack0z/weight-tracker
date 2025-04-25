import * as React from "react"

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={`w-full caption-bottom text-sm ${className}`}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => {
  const isDarkTheme = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    true;
    
  return (
    <thead 
      ref={ref} 
      className={`[&_tr]:border-b ${isDarkTheme ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'} ${className}`} 
      {...props} 
    />
  );
})
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`[&_tr:last-child]:border-0 ${className}`}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => {
  const isDarkTheme = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    true;
    
  return (
    <tfoot
      ref={ref}
      className={`border-t ${isDarkTheme ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'} font-medium ${className}`}
      {...props}
    />
  );
})
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => {
  // Access the theme from the document element
  const isDarkTheme = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    true; // Default to dark theme if document is not available
  
  return (
    <tr
      ref={ref}
      className={`border-b ${isDarkTheme ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'} transition-colors ${isDarkTheme ? 'hover:bg-[#2b2d31]' : 'hover:bg-[#B9C0AB]'} ${className}`}
      {...props}
    />
  );
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => {
  const isDarkTheme = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    true;
    
  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium ${isDarkTheme ? 'text-[#b5bac1]' : 'text-[#829181]'} [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => {
  const isDarkTheme = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    true;
    
  return (
    <caption
      ref={ref}
      className={`mt-4 text-sm ${isDarkTheme ? 'text-[#b5bac1]' : 'text-[#829181]'} ${className}`}
      {...props}
    />
  );
})
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} 