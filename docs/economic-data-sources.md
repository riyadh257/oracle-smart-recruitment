# Saudi Economic Data Sources Research

## Overview
Research findings on available Saudi economic data sources for real-time integration.

## GASTAT (General Authority for Statistics)
- **Website**: https://www.stats.gov.sa/en/
- **Data Platform**: https://dp.stats.gov.sa/
- **Open Data**: https://dp.stats.gov.sa/opendata
- **Status**: Website appears to have loading issues, may require authentication
- **Coverage**: Economic, social, environmental statistics

### Key Features
- Official statistical reference for Saudi Arabia
- Economic data platform launched for easier access
- Covers labor market, health, demographics, lifestyle statistics
- Requires user account creation (Nafath or email registration)

## SAMA (Saudi Central Bank)
- **Website**: https://www.sama.gov.sa/en-US/
- **Open Data Portal**: https://www.sama.gov.sa/en-US/EconomicReports/pages/database.aspx
- **Status**: Accessible, provides comprehensive economic indicators

### Available Data Categories
1. **Monetary and Financial Statistics**
   - Money Supply (M1, M2, M3)
   - Balance sheets
   - Commercial bank data

2. **Exchange Rates and Interest Rates**
   - Currency exchange rates (USD, EUR, AED, KWD, etc.)
   - Interest rate benchmarks

3. **External Sector**
   - Balance of payments
   - International reserves

4. **National Accounts**
   - GDP indicators
   - Economic growth metrics

5. **Public Finance**
   - Government revenues and expenditures

6. **Price Indices**
   - Inflation indicators
   - Consumer price index

7. **Energy Sector**
   - Oil and energy statistics

8. **Insurance Sector**
   - Insurance market data

9. **Investment Funds**
   - Fund performance metrics

10. **Clearing and Payment Systems**
    - Payment transaction data

### Data Access Methods
- Web portal with visual summaries
- Statistical charts available
- Search functionality
- Downloadable reports (Monthly Statistics, Quarterly Statistics, Annual Reports)

## Alternative Data Sources

### World Bank
- **URL**: https://data.worldbank.org/country/saudi-arabia
- **Coverage**: GDP, economic indicators, development metrics

### IMF DataMapper
- **URL**: https://www.imf.org/external/datamapper/profile/SAU
- **Coverage**: Real GDP growth, GDP per capita, macroeconomic indicators

### Arab Development Portal
- **URL**: https://dataportal.unescwa.org/country/sau/data/economic
- **Coverage**: Macroeconomic indicators, HDI, GDP

## Implementation Strategy

### Phase 1: SAMA Integration (Primary)
Since SAMA provides accessible open data without apparent API restrictions, we'll start with SAMA data:
1. Web scraping approach for real-time data
2. Focus on key indicators:
   - Exchange rates
   - Money supply
   - Interest rates
   - Inflation indices
   - GDP growth

### Phase 2: Third-party API Integration (Backup)
Use World Bank and IMF APIs as supplementary sources:
1. World Bank API for historical GDP data
2. IMF API for macroeconomic forecasts
3. Cross-validation between sources

### Phase 3: GASTAT Integration (Future)
1. Investigate API access requirements
2. Register for data platform access
3. Integrate labor market statistics
4. Add Saudization-specific metrics

## Key Economic Indicators for Recruitment Context

### Macro Indicators
- GDP Growth Rate
- Unemployment Rate
- Inflation Rate (CPI)
- Oil Prices (Brent Crude)

### Labor Market Indicators
- Labor Force Participation Rate
- Employment by Sector
- Wage Growth
- Saudization Rate (Nitaqat compliance)

### Financial Indicators
- Interest Rates (SAIBOR)
- Exchange Rates (SAR/USD)
- Stock Market Index (TASI)
- Foreign Direct Investment

### Sector-Specific
- Private Sector Employment Growth
- Government Employment Trends
- Youth Unemployment Rate
- Female Labor Force Participation

## Data Refresh Strategy
- **High Priority (Daily)**: Exchange rates, stock indices
- **Medium Priority (Weekly)**: Money supply, interest rates
- **Low Priority (Monthly)**: GDP, inflation, employment statistics
- **Quarterly**: Comprehensive economic reports

## Technical Approach
1. Build web scraping service for SAMA portal
2. Implement caching layer (Redis/database)
3. Schedule automated data fetching
4. Provide fallback to cached data on API failures
5. Alert system for stale data (>24 hours for daily metrics)
