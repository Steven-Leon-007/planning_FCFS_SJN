export const sortBySJN = (processes) => {
  console.log([...processes].sort((a, b) => a.burst - b.burst));
  
  return [...processes].sort((a, b) => a.burst - b.burst);
};
