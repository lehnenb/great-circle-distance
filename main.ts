import CustomerParserService from "./src/services/customer_parser_service"

(function main(): void {
  const args = process.argv.slice(2);

  new CustomerParserService(args[0])
    .on('done', (errors, customers) => {
      if (errors.length > 0) {
        console.log('############ Warnings ################');
        errors.forEach(([line, message]) => console.warn(`Error on line ${line}: ${message}`));
        console.log('############ Warnings ################\n\n');
      }

      if (customers.length > 0) {
        console.log('############ Customers ################');
        customers.forEach(({ id }) => console.log(id));
        console.log('############ Customers ################');
      }
    });
})();
