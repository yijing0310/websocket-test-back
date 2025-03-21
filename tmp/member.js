member 
like_prod_ary

1,2
通常like會儲存在會員狀態

add_prod_like(prod_id) {
    const like_prod_ary = memberData.like_prod_ary;
    let ary = like_prod_ary.join(',')
    ary.push(prod_id)
    
}
